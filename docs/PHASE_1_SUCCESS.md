# Phase 1: Audio Pipeline - SUCCESS ✅

**Date:** October 4, 2025
**Status:** ✅ COMPLETE
**Location:** `prototype/phase-1/`

---

## 🎉 What We Built

A **standalone Node.js audio pipeline** that validates the core technology stack:

**Microphone → VAD (Voice Activity Detection) → Whisper → Text**

This proves the entire pipeline works before integrating into Electron.

---

## 📦 Technologies Used

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **sherpa-onnx-node** | ONNX Runtime + VAD + Whisper all-in-one | Single package with everything we need, works on macOS |
| **naudiodon2** | Microphone capture via PortAudio | Official Node.js bindings, cross-platform |
| **Silero VAD** | Voice Activity Detection model | Detects speech vs silence (silero_vad.onnx) |
| **Whisper tiny.en** | Speech-to-text model | OpenAI's Whisper, int8 quantized for CPU speed |

---

## 🔍 Research & Approach

### How We Found the Solution

1. **Started Fresh** - Deleted all misleading documentation with false assumptions about ONNX models
2. **Used Context7** - Searched for official sherpa-onnx documentation and examples
3. **Found sherpa-onnx-node** - Discovered it provides VAD + Whisper in one package
4. **Studied Examples** - Referenced official Node.js examples from sherpa-onnx GitHub

### Key Decision: Standalone First

Instead of jumping into Electron immediately:
- Built **standalone Node.js prototype** (`prototype/phase-1/`)
- Validated each piece independently
- Avoided Electron complexity until pipeline was proven

### What We Learned

- **API differences**: Used `new sherpa_onnx.Vad()` not `createVad()` (found by reading actual examples)
- **CommonJS required**: Used `require()` not ES6 `import`
- **Library path critical**: Must set `DYLD_LIBRARY_PATH` on macOS (different for Intel vs ARM)
- **CircularBuffer essential**: `sherpa_onnx.CircularBuffer()` manages streaming audio from microphone

---

## 🔑 Key Implementation Patterns

### 1. Initialize VAD
```javascript
const sherpa_onnx = require('sherpa-onnx-node');

const vadConfig = {
  sileroVad: {
    model: 'models/silero_vad.onnx',
    threshold: 0.5,
    minSilenceDuration: 0.5,
    minSpeechDuration: 0.25,
    maxSpeechDuration: 5,
    windowSize: 512,
  },
  sampleRate: 16000,
  numThreads: 1,
};

const vad = new sherpa_onnx.Vad(vadConfig, 60); // 60 second buffer
```

### 2. Initialize Whisper
```javascript
const recognizerConfig = {
  featConfig: { sampleRate: 16000, featureDim: 80 },
  modelConfig: {
    whisper: {
      encoder: 'models/tiny.en-encoder.int8.onnx',
      decoder: 'models/tiny.en-decoder.int8.onnx',
    },
    tokens: 'models/tiny.en-tokens.txt',
    numThreads: 2,
    provider: 'cpu',
  },
};

const recognizer = new sherpa_onnx.OfflineRecognizer(recognizerConfig);
```

### 3. Capture Microphone Audio
```javascript
const portAudio = require('naudiodon2');

const ai = new portAudio.AudioIO({
  inOptions: {
    channelCount: 1,
    sampleFormat: portAudio.SampleFormatFloat32,
    sampleRate: 16000,
  }
});

const buffer = new sherpa_onnx.CircularBuffer(30 * 16000); // 30 sec buffer

ai.on('data', data => {
  const samples = new Float32Array(data.buffer);
  buffer.push(samples);

  while (buffer.size() > 512) {
    const chunk = buffer.get(buffer.head(), 512);
    buffer.pop(512);
    vad.acceptWaveform(chunk);
  }
});

ai.start();
```

### 4. Extract Speech & Transcribe
```javascript
vad.flush();

while (!vad.isEmpty()) {
  const segment = vad.front();
  vad.pop();

  const stream = recognizer.createStream();
  stream.acceptWaveform({
    sampleRate: 16000,
    samples: segment.samples,
  });

  recognizer.decode(stream);
  const result = recognizer.getResult(stream);
  console.log(result.text); // Transcribed text
}
```

---

## 🚀 How to Run

### Setup
```bash
cd prototype/phase-1
npm install  # Installs sherpa-onnx-node and naudiodon2
```

### Run Tests
```bash
# File-based test (validates VAD + Whisper with pre-recorded audio)
./run-test.sh

# Microphone test (validates full pipeline with real mic input)
./run-test.sh mic
```

The `run-test.sh` script automatically:
- Detects Intel vs Apple Silicon
- Sets correct `DYLD_LIBRARY_PATH`
- Runs the appropriate test

---

## 📁 What We Created

```
prototype/phase-1/
├── test-audio-pipeline.js    # File-based validation
├── test-mic-capture.js        # Microphone validation
├── run-test.sh                # Helper script (auto-detects architecture)
├── package.json               # Dependencies
├── models/
│   ├── silero_vad.onnx       # VAD model
│   └── sherpa-onnx-whisper-tiny.en/
│       ├── tiny.en-encoder.int8.onnx
│       ├── tiny.en-decoder.int8.onnx
│       └── tiny.en-tokens.txt
└── README.md
```

---

## 📊 Results

✅ **VAD Detection** - Accurately detects speech vs silence in real-time
✅ **Whisper Transcription** - ~2-3 seconds for 5-6 seconds of audio
✅ **Microphone Capture** - Works with MacBook Pro mic via naudiodon2
✅ **Cross-Platform** - Works on both Intel and Apple Silicon Macs
✅ **CPU-only** - int8 quantized models run efficiently without GPU

---

## 🔜 Next Steps

### Phase 2: Electron Integration
- Move working pipeline into Electron worker thread
- Implement IPC communication (main ↔ worker)
- Connect to existing UI (pill overlay)
- Add clipboard/paste functionality

### Phase 3: Complete MVP
- Global hotkey (Command+B)
- Full end-to-end flow
- Performance optimization
- Error handling

---

## 📝 References

- [sherpa-onnx GitHub](https://github.com/k2-fsa/sherpa-onnx) - Main library
- [sherpa-onnx Node.js Examples](https://github.com/k2-fsa/sherpa-onnx/tree/master/nodejs-addon-examples) - How we learned the API
- [naudiodon2 (npm)](https://www.npmjs.com/package/naudiodon2) - Microphone capture
- [Silero VAD](https://github.com/snakers4/silero-vad) - Voice Activity Detection model
