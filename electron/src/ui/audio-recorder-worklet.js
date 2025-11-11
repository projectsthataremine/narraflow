/**
 * AudioWorklet processor for capturing raw PCM audio data
 * Runs on audio rendering thread for optimal performance
 */

class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;

    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.command === 'start') {
        this.isRecording = true;
      } else if (event.data.command === 'stop') {
        this.isRecording = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // If we have input and we're recording, send the audio data
    if (this.isRecording && input && input[0]) {
      const audioData = input[0]; // First channel (mono)

      // Copy the Float32Array to send to main thread
      // (we need to copy because the buffer is reused)
      const chunk = new Float32Array(audioData);

      this.port.postMessage({
        type: 'audiodata',
        chunk: chunk
      }, [chunk.buffer]); // Transfer ownership for zero-copy
    }

    // Keep processor alive
    return true;
  }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
