import Foundation
import Speech
import AVFoundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

// MARK: - HTTP Server

class HTTPServer {
    let port: UInt16
    var serverSocket: Int32 = -1
    var isRunning = false

    init(port: UInt16 = 50061) {
        self.port = port
    }

    func start() throws {
        // Create socket
        serverSocket = socket(AF_INET, SOCK_STREAM, 0)
        guard serverSocket >= 0 else {
            throw NSError(domain: "HTTPServer", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to create socket"])
        }

        // Allow address reuse
        var yes: Int32 = 1
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &yes, socklen_t(MemoryLayout<Int32>.size))

        // Bind to port
        var serverAddr = sockaddr_in()
        serverAddr.sin_family = sa_family_t(AF_INET)
        serverAddr.sin_port = port.bigEndian
        serverAddr.sin_addr.s_addr = inet_addr("127.0.0.1")

        let bindResult = withUnsafePointer(to: &serverAddr) { ptr in
            ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPtr in
                bind(serverSocket, sockaddrPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }

        guard bindResult >= 0 else {
            close(serverSocket)
            throw NSError(domain: "HTTPServer", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to bind to port \(port)"])
        }

        // Listen
        guard listen(serverSocket, 5) >= 0 else {
            close(serverSocket)
            throw NSError(domain: "HTTPServer", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to listen on socket"])
        }

        isRunning = true
        print("✅ SpeechAnalyzer HTTP server started on http://127.0.0.1:\(port)")

        // Accept connections
        while isRunning {
            var clientAddr = sockaddr_in()
            var clientAddrLen = socklen_t(MemoryLayout<sockaddr_in>.size)

            let clientSocket = withUnsafeMutablePointer(to: &clientAddr) { ptr in
                ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPtr in
                    accept(serverSocket, sockaddrPtr, &clientAddrLen)
                }
            }

            guard clientSocket >= 0 else { continue }

            // Handle request in background
            DispatchQueue.global().async { [weak self] in
                self?.handleClient(socket: clientSocket)
            }
        }
    }

    func stop() {
        isRunning = false
        if serverSocket >= 0 {
            close(serverSocket)
            serverSocket = -1
        }
    }

    private func handleClient(socket: Int32) {
        defer { close(socket) }

        // Read request headers first (up to 8KB should be enough for headers)
        var headerBuffer = [UInt8](repeating: 0, count: 8192)
        let headerBytesRead = recv(socket, &headerBuffer, headerBuffer.count, 0)
        guard headerBytesRead > 0 else { return }

        let headerData = Data(headerBuffer.prefix(headerBytesRead))
        guard let requestString = String(data: headerData, encoding: .utf8) else { return }

        // Parse HTTP request line
        let lines = requestString.components(separatedBy: "\r\n")
        guard let requestLine = lines.first else { return }
        let components = requestLine.components(separatedBy: " ")
        guard components.count >= 2 else { return }

        let method = components[0]
        let path = components[1]

        print("📝 \(method) \(path)")

        // Route request
        switch (method, path) {
        case ("GET", "/health"):
            handleHealth(socket: socket)
        case ("POST", "/transcribe"):
            handleTranscribe(socket: socket, headerData: headerData, headerBytesRead: headerBytesRead)
        default:
            send404(socket: socket)
        }
    }

    private func handleHealth(socket: Int32) {
        let response = """
        HTTP/1.1 200 OK\r
        Content-Type: application/json\r
        Connection: close\r
        \r
        {"status":"ok","engine":"SpeechAnalyzer"}
        """
        send(socket, response, response.count, 0)
    }

    private func handleTranscribe(socket: Int32, headerData: Data, headerBytesRead: Int) {
        // Find boundary between headers and body
        guard let headersEnd = headerData.range(of: Data("\r\n\r\n".utf8))?.upperBound else {
            send400(socket: socket, message: "Invalid request format")
            return
        }

        // Parse Content-Length header
        guard let headerString = String(data: headerData.prefix(headersEnd), encoding: .utf8) else {
            send400(socket: socket, message: "Invalid headers encoding")
            return
        }

        var contentLength = 0
        for line in headerString.components(separatedBy: "\r\n") {
            if line.lowercased().starts(with: "content-length:") {
                let value = line.dropFirst("content-length:".count).trimmingCharacters(in: .whitespaces)
                contentLength = Int(value) ?? 0
                break
            }
        }

        guard contentLength > 0 else {
            send400(socket: socket, message: "Missing or invalid Content-Length header")
            return
        }

        print("🎤 Expecting \(contentLength) bytes of audio data")

        // Calculate how much body data we already have from the header read
        let headersEndOffset = headersEnd - headerData.startIndex
        let bodyDataAlreadyRead = headerBytesRead - headersEndOffset
        var audioData = Data(headerData.suffix(from: headersEnd))

        // Read remaining body data in chunks if needed
        let remainingBytes = contentLength - bodyDataAlreadyRead
        if remainingBytes > 0 {
            var buffer = [UInt8](repeating: 0, count: min(remainingBytes, 65536)) // 64KB chunks
            var totalRead = bodyDataAlreadyRead

            while totalRead < contentLength {
                let bytesToRead = min(buffer.count, contentLength - totalRead)
                let bytesRead = recv(socket, &buffer, bytesToRead, 0)
                guard bytesRead > 0 else {
                    send500(socket: socket, message: "Connection closed while reading body")
                    return
                }
                audioData.append(contentsOf: buffer.prefix(bytesRead))
                totalRead += bytesRead
            }
        }

        guard audioData.count == contentLength else {
            send400(socket: socket, message: "Body size mismatch: expected \(contentLength), got \(audioData.count)")
            return
        }

        print("🎤 Received \(audioData.count) bytes of audio")

        // Transcribe audio (synchronous for simplicity)
        let semaphore = DispatchSemaphore(value: 0)
        var transcriptionResult: String?
        var transcriptionError: String?

        SpeechAnalyzerTranscriber.shared.transcribe(audioData: audioData) { result in
            switch result {
            case .success(let text):
                transcriptionResult = text
            case .failure(let error):
                transcriptionError = error.localizedDescription
            }
            semaphore.signal()
        }

        // Wait for transcription (with timeout)
        let timeout = DispatchTime.now() + .seconds(60)
        let result = semaphore.wait(timeout: timeout)

        if result == .timedOut {
            send500(socket: socket, message: "Transcription timed out")
            return
        }

        if let error = transcriptionError {
            send500(socket: socket, message: error)
            return
        }

        guard let text = transcriptionResult else {
            send500(socket: socket, message: "Unknown transcription error")
            return
        }

        // Send response (OpenAI Whisper API compatible format)
        let jsonResponse = ["text": text]
        guard let jsonData = try? JSONSerialization.data(withJSONObject: jsonResponse),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            send500(socket: socket, message: "Failed to encode response")
            return
        }

        let response = """
        HTTP/1.1 200 OK\r
        Content-Type: application/json\r
        Content-Length: \(jsonString.utf8.count)\r
        Connection: close\r
        \r
        \(jsonString)
        """
        send(socket, response, response.count, 0)

        print("✅ Transcription complete: \(text.prefix(50))...")
    }

    private func send400(socket: Int32, message: String) {
        let response = """
        HTTP/1.1 400 Bad Request\r
        Content-Type: text/plain\r
        Connection: close\r
        \r
        \(message)
        """
        send(socket, response, response.count, 0)
    }

    private func send404(socket: Int32) {
        let response = """
        HTTP/1.1 404 Not Found\r
        Content-Type: text/plain\r
        Connection: close\r
        \r
        Not Found
        """
        send(socket, response, response.count, 0)
    }

    private func send500(socket: Int32, message: String) {
        let response = """
        HTTP/1.1 500 Internal Server Error\r
        Content-Type: text/plain\r
        Connection: close\r
        \r
        \(message)
        """
        send(socket, response, response.count, 0)
    }
}

// MARK: - SpeechAnalyzer Transcriber

@available(macOS 26.0, *)
class SpeechAnalyzerTranscriber {
    static let shared = SpeechAnalyzerTranscriber()
    private var isAuthorized = false
    private let authQueue = DispatchQueue(label: "com.narraflow.speechanalyzer.auth")

    private init() {
        // Request authorization on init (async, non-blocking)
        requestAuthorizationIfNeeded()
    }

    private func requestAuthorizationIfNeeded() {
        authQueue.async {
            let semaphore = DispatchSemaphore(value: 0)

            SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
                self?.isAuthorized = (authStatus == .authorized)
                if authStatus == .authorized {
                    print("✅ Speech recognition authorized")
                } else {
                    print("❌ Speech recognition not authorized: \(authStatus.rawValue)")
                }
                semaphore.signal()
            }

            // Wait for authorization check to complete
            semaphore.wait()
        }
    }

    func transcribe(audioData: Data, completion: @escaping (Result<String, Error>) -> Void) {
        // Check authorization status
        guard isAuthorized else {
            completion(.failure(NSError(domain: "SpeechAnalyzer", code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Speech recognition not authorized. Please grant permission in System Settings."])))
            return
        }

        // Save audio data to temporary file
        let tempDir = NSTemporaryDirectory()
        let tempFilePath = (tempDir as NSString).appendingPathComponent("transcribe_\(UUID().uuidString).wav")
        let tempFileURL = URL(fileURLWithPath: tempFilePath)

        do {
            try audioData.write(to: tempFileURL)
        } catch {
            completion(.failure(error))
            return
        }

        // Create DictationTranscriber for natural speech with punctuation
        let locale = Locale(identifier: "en-US")
        let transcriber = DictationTranscriber(locale: locale)

        Task {
            do {
                // Create SpeechAnalyzer
                let analyzer = SpeechAnalyzer(modules: [transcriber])

                // Start analysis from file
                try await analyzer.start(inputAudioFile: tempFileURL)
                try await analyzer.finalizeAndFinishThroughEndOfInput()

                // Collect results
                var fullText = ""
                for try await result in transcriber.results {
                    if result.isFinal {
                        fullText += result.text.string
                    }
                }

                // Clean up temp file
                try? FileManager.default.removeItem(at: tempFileURL)

                completion(.success(fullText.trimmingCharacters(in: .whitespacesAndNewlines)))
            } catch {
                // Clean up temp file
                try? FileManager.default.removeItem(at: tempFileURL)
                completion(.failure(error))
            }
        }
    }
}

// MARK: - Main

@available(macOS 26.0, *)
func checkAuthorization() -> Bool {
    let semaphore = DispatchSemaphore(value: 0)
    var authorized = false

    SFSpeechRecognizer.requestAuthorization { authStatus in
        authorized = (authStatus == .authorized)
        if !authorized {
            print("❌ Speech recognition not authorized")
            print("   Please grant permission in System Settings > Privacy & Security > Speech Recognition")
        }
        semaphore.signal()
    }

    semaphore.wait()
    return authorized
}

if #available(macOS 26.0, *) {
    // Check authorization before starting server
    print("🔑 Checking speech recognition authorization...")
    guard checkAuthorization() else {
        print("❌ Cannot start server without speech recognition permission")
        print("   Grant permission in System Settings and restart the app")
        exit(1)
    }

    let server = HTTPServer()

    // Handle signals for graceful shutdown
    signal(SIGINT) { _ in
        print("\n🛑 Shutting down server...")
        exit(0)
    }

    do {
        try server.start()
    } catch {
        print("❌ Failed to start server: \(error)")
        exit(1)
    }
} else {
    print("❌ SpeechAnalyzer requires macOS 26.0 or later")
    exit(1)
}
