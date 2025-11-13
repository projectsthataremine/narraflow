# Transcription Bugs

## Critical Issues with Whisper Transcription System

### 1. Severe Truncation
**Severity:** Critical
**Description:** Long messages are being severely truncated, losing 50-60% of the original content.

**Example:**
- User spoke 4-5 full sentences about a logging system design
- Transcription output: "library library library library library..." (repeated word)
- Lost: Entire context and meaning of the original message
- Only captured ~40% of actual speech

**Impact:** Users cannot rely on the system for anything longer than very short phrases.

---

### 2. Inconsistent Quality
**Severity:** High
**Description:** Transcription quality is extremely inconsistent between recordings.

**Observations:**
- Some recordings: Perfect capture of entire message
- Other recordings: Severe truncation (see bug #1)
- No apparent pattern or trigger
- Happens with similar length messages and recording conditions

**Impact:** Users cannot trust the system - it's unpredictable whether their speech will be captured correctly.

---

### 3. Trailing Characters
**Severity:** Medium
**Description:** Extra underscores and spaces are appearing at the end of transcriptions.

**Example:**
```
"...to the library or the library or the_ "
```

**Observations:**
- Underscore followed by space appears at end of some transcriptions
- Not present in all transcriptions
- Appears to be related to text cleanup/formatting logic

**Impact:** User needs to manually delete trailing characters, disrupting workflow.

---

## Investigation Areas

1. **Audio Collection**
   - Is all audio data being captured by AudioRecorder?
   - Check sample counts and buffer management
   - Verify no data loss during IPC transfer to main process

2. **VAD (Voice Activity Detection)**
   - Is VAD cutting off speech prematurely?
   - Check silence detection thresholds
   - Review timing of when recording stops

3. **Whisper Model Processing**
   - Is the model receiving all audio data?
   - Check for any truncation in the pipeline
   - Verify audio format and sample rate compatibility

4. **Text Cleanup Logic**
   - Review the cleaning/formatting code
   - Check for issues with trailing character removal
   - Look at word repetition handling

---

## Next Steps

1. Add detailed logging to track audio data flow
2. Compare audio sample counts at each stage
3. Review VAD configuration and thresholds
4. Test Whisper model directly with known audio samples
5. Audit text cleanup and formatting logic
