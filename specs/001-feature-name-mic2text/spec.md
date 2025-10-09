# Feature Specification: Mic2Text MVP

**Feature Branch**: `001-feature-name-mic2text`
**Created**: 2025-10-04
**Status**: Draft
**Inspiration**: Wispr Flow app
**Input**: User description: "Feature Name: Mic2Text MVP - A lightweight macOS app that lets users hold a key, speak naturally, and have their speech instantly transcribed to text offline. The app trims silence, lightly cleans up the text, copies it to the clipboard, and pastes it into the currently focused field. It runs entirely offline, stores nothing, and uses a simple 'pill' UI at the bottom center of the screen that visually responds while recording and processing."

## Clarifications

### Session 2025-10-04
- Q: Specific behavior when text cleanup fails - should user be notified or silently use raw text? → A: Silently paste the raw text (no user notification)
- Q: What constitutes "silence" for trimming purposes - specific dB threshold or duration? → A: Both decibel threshold and duration should be considered
- Q: Exact behavior for "no focused text field" - clipboard only or show notification? → A: Clipboard only (no paste, no notification)

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature description provided: Mic2Text MVP
2. Extract key concepts from description
   → Identified: macOS user, hotkey activation, audio recording, VAD, offline transcription, text cleanup, clipboard/paste, pill UI, error handling
3. For each unclear aspect:
   → Resolved: Text cleanup failure silently uses raw text
   → Resolved: Silence detection uses both dB threshold and duration
   → Resolved: No focused text field results in clipboard-only operation
4. Fill User Scenarios & Testing section
   → User flow clearly defined from description
5. Generate Functional Requirements
   → All requirements testable and derived from acceptance criteria
6. Identify Key Entities
   → No persistent data entities (privacy-first, no storage)
7. Run Review Checklist
   → All clarifications resolved
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a Mac user, I want to hold down a key, speak, and see my transcribed text appear instantly wherever I'm typing — without switching apps, using the cloud, or managing any recordings.

### Acceptance Scenarios

1. **Given** the app is running in the background, **When** the user presses and holds Command + B, **Then** the system begins recording audio and displays an animated pill UI at the bottom-center of the screen showing the current voice activity state.

2. **Given** the user is actively recording, **When** the user speaks, **Then** the pill UI transitions from "Silent" to "Talking" state in real time based on voice activity detection.

3. **Given** the user has finished speaking and releases Command + B, **When** the recording stops, **Then** the system trims silence from the beginning and end, transcribes the audio offline, cleans up the text, copies it to the clipboard, and pastes it into the currently focused text field within 3 seconds for short phrases.

4. **Given** the user records only silence (no speech), **When** the recording stops, **Then** the system does nothing - no clipboard change, no paste action.

5. **Given** transcription fails for any reason, **When** the recording completes, **Then** a small black error pop-up appears at the bottom-center displaying "Error, please try again" and nothing is pasted or copied.

6. **Given** text cleanup fails during processing, **When** transcription completes successfully, **Then** the system falls back to the raw transcription text and continues with clipboard copy and paste operations.

### Edge Cases

- What happens when the user presses Command + B multiple times in quick succession?
  - Expected: System should handle rapid activations gracefully without crashing or creating race conditions

- What happens when there is no focused text field when paste is triggered?
  - Expected: Text is copied to clipboard only; no paste operation and no notification

- What happens when the microphone is unavailable or already in use by another application?
  - Expected: Error pop-up should appear indicating the issue

- What happens during long pauses or in noisy environments?
  - Expected: VAD should handle background noise and distinguish it from speech, pill UI should reflect "Silent" during pauses

- What happens if the user holds Command + B for an extended period?
  - Expected: Recording continues with no time limit, transcription processes the full audio when released

## Requirements *(mandatory)*

### Functional Requirements

**Core Recording & Transcription**
- **FR-001**: System MUST begin audio recording immediately when the user presses and holds Command + B
- **FR-002**: System MUST capture audio at 16 kHz sample rate in mono format
- **FR-003**: System MUST support recording with no time limit or silence-length restrictions
- **FR-004**: System MUST stop recording when the user releases Command + B
- **FR-005**: System MUST detect voice activity in real time during recording
- **FR-006**: System MUST trim silence from the beginning and end of recordings before transcription using both decibel threshold and duration criteria
- **FR-007**: System MUST transcribe audio to English text entirely offline using an embedded speech recognition model
- **FR-008**: System MUST complete transcription and paste for short phrases within 3 seconds

**Text Processing & Output**
- **FR-009**: System MUST attempt to clean up transcribed text automatically
- **FR-010**: System MUST fall back to raw transcription text if cleanup fails, without notifying the user
- **FR-011**: System MUST copy the final text to the system clipboard
- **FR-012**: System MUST paste the final text into the currently focused text field automatically if a text field is focused
- **FR-012a**: System MUST copy text to clipboard only (without paste) when no text field is focused
- **FR-013**: System MUST NOT perform any clipboard or paste operations when only silence is recorded

**UI & Feedback**
- **FR-014**: System MUST display a pill-shaped UI element at the bottom-center of the screen during recording and processing
- **FR-015**: System MUST visually represent four distinct states in the pill UI: Loading, Silent, Talking, and Processing
- **FR-016**: System MUST transition the pill UI between Silent and Talking states based on real-time voice activity detection
- **FR-017**: System MUST match the pill UI design exactly to the reference assets in the design/ folder (pill_loading.png, pill_silent.png, pill_talking.png, pill_processing.png)
- **FR-018**: System MUST use a fixed pixel width for the pill UI consistent with the design screenshots
- **FR-019**: System MUST display a small black error pop-up at the bottom-center of the screen when transcription fails
- **FR-020**: Error pop-up MUST display the text "Error, please try again"
- **FR-021**: Error pop-up MUST match the design shown in error_popup.png

**Privacy & Constraints**
- **FR-022**: System MUST operate entirely offline with no network calls
- **FR-023**: System MUST NOT log any audio, transcriptions, or user activity
- **FR-024**: System MUST NOT persist or save any recordings or data
- **FR-025**: System MUST support English language transcription only

**System Integration**
- **FR-026**: System MUST use Command + B as the default hotkey for activation
- **FR-027**: System MUST NOT conflict with existing macOS system shortcuts
- **FR-028**: System MUST run in the background on macOS
- **FR-029**: System MUST NOT integrate with the menu bar

**Error Handling**
- **FR-030**: System MUST display an error pop-up when the microphone is unavailable or busy
- **FR-031**: System MUST handle multiple rapid hotkey activations without crashing

### Performance Requirements
- **PR-001**: Short phrase transcriptions MUST complete within 3 seconds from key release to paste completion
- **PR-002**: Voice activity detection MUST update the UI in real time with minimal latency
- **PR-003**: Silence detection MUST use both decibel threshold and duration criteria to determine trimming boundaries

### Key Entities *(N/A - no persistent data)*
This feature explicitly stores no data and maintains no persistent entities due to its privacy-first design.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked and resolved (3 items clarified)
- [x] User scenarios defined
- [x] Requirements generated (33 functional, 3 performance)
- [x] Entities identified (none - no persistent data)
- [x] Review checklist passed

---

## Out of Scope for MVP

The following items are explicitly excluded from this release:
- Account management and authentication systems
- Cloud-based text polishing or processing
- User preference settings or configuration panels
- Menu bar controls or icons
- Support for languages other than English
- Audio or transcription logging/analytics
- Persistent storage of any kind

---

## Design References

All UI specifications are defined by visual assets located in the `design/` folder:
- `app_home.png` - Overall app home screen layout
- `error_popup.png` - Error state presentation
- `pill_loading.png` - Pill UI in Loading state
- `pill_silent.png` - Pill UI in Silent state
- `pill_talking.png` - Pill UI in Talking state
- `pill_processing.png` - Pill UI in Processing state

The implementation MUST match these designs exactly in terms of visual appearance, positioning, and dimensions.
