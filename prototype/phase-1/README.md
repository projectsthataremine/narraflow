# Phase 1 Prototype: Standalone Audio Pipeline

This is a **standalone Node.js prototype** to prove the 3-phase audio pipeline works:

1. **Mic** - Audio capture
2. **VAD** - Voice Activity Detection (Silero VAD)
3. **Whisper** - Speech-to-text transcription

## ✅ What's Working

- Silero VAD (detects speech segments in audio)
- Whisper tiny.en (transcribes audio to text)
- Test with sample audio files

## 🚧 What's Next

- Add microphone capture for real-time audio

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Library Path (macOS)

**For Apple Silicon (M1/M2/M3):**
```bash
export DYLD_LIBRARY_PATH=$PWD/node_modules/sherpa-onnx-darwin-arm64:$DYLD_LIBRARY_PATH
```

**For Intel Macs:**
```bash
export DYLD_LIBRARY_PATH=$PWD/node_modules/sherpa-onnx-darwin-x64:$DYLD_LIBRARY_PATH
```

---

## Running the Test

```bash
node test-audio-pipeline.js
```

### Expected Output

```
🎤 Mic2Text Phase 1 Prototype
==============================

📁 Configuration:
  VAD Model: .../models/silero_vad.onnx
  Whisper Encoder: .../models/sherpa-onnx-whisper-tiny.en/tiny.en-encoder.int8.onnx
  Whisper Decoder: .../models/sherpa-onnx-whisper-tiny.en/tiny.en-decoder.int8.onnx
  Test Audio: .../models/sherpa-onnx-whisper-tiny.en/test_wavs/0.wav

🔧 Initializing VAD...
✅ VAD initialized

🔧 Initializing Whisper recognizer...
✅ Whisper recognizer initialized

🎵 Testing with audio file: .../test_wavs/0.wav
   Sample rate: 16000 Hz
   Duration: 3.84s

🔍 Running VAD to detect speech segments...
   Speech detected: 0.00s - 3.84s (3.84s)

✅ Found 1 speech segment(s)

✍️  Transcribing speech segments...

   Segment 1: " Ask not what your country can do for you. Ask what you can do for your country."

🎉 Test complete!

📝 Next steps:
   1. ✅ VAD working - detects speech segments
   2. ✅ Whisper working - transcribes audio
   3. ⏭️  Next: Add microphone capture
```

---

## How It Works

### Phase 1: VAD (Voice Activity Detection)

```javascript
const vad = sherpa_onnx.createVad(config.vad);
vad.acceptWaveform(audioSamples);

while (!vad.isEmpty()) {
  const speechSegment = vad.front();
  vad.pop();
  // speechSegment contains audio with speech only
}
```

### Phase 2: Whisper Transcription

```javascript
const recognizer = sherpa_onnx.createOfflineRecognizer(config.whisper);
const stream = recognizer.createStream();

stream.acceptWaveform({
  samples: speechSegment.samples,
  sampleRate: 16000,
});

recognizer.decode(stream);
const result = recognizer.getResult(stream);
console.log(result.text); // Transcribed text
```

---

## Files

```
prototype/phase-1/
├── test-audio-pipeline.js     # Main test script
├── package.json               # Dependencies
├── models/
│   ├── silero_vad.onnx       # VAD model (copied from resources/)
│   └── sherpa-onnx-whisper-tiny.en/
│       ├── tiny.en-encoder.int8.onnx
│       ├── tiny.en-decoder.int8.onnx
│       ├── tiny.en-tokens.txt
│       └── test_wavs/         # Sample audio files
└── README.md                  # This file
```

---

## Cross-Platform Compatibility

✅ **Intel Macs** - Set `DYLD_LIBRARY_PATH` to `sherpa-onnx-darwin-x64`
✅ **Apple Silicon (M1/M2/M3)** - Set `DYLD_LIBRARY_PATH` to `sherpa-onnx-darwin-arm64`

The same code works on both architectures!

---

## Troubleshooting

### Error: "Cannot find module 'sherpa-onnx-node'"

Run: `npm install`

### Error: "dyld: Library not loaded"

Set the `DYLD_LIBRARY_PATH` environment variable (see Setup section above).

### No speech detected

Check that the audio file exists and is in the correct format (16kHz, mono, WAV).

---

## Next Steps

Once this test passes:

1. Add microphone capture (using `naudiodon2` or similar)
2. Test real-time audio → VAD → Whisper pipeline
3. Integrate into Electron app (Phase 2)
