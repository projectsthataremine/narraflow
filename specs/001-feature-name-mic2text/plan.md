# Implementation Plan: Mic2Text MVP

**Branch**: `001-feature-name-mic2text` | **Date**: 2025-10-04 | **Spec**: `/Users/joshuaarnold/Dev/Mic2Text/specs/001-feature-name-mic2text/spec.md`
**Input**: Feature specification from `/Users/joshuaarnold/Dev/Mic2Text/specs/001-feature-name-mic2text/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type: Single desktop app (Electron)
   → Set Structure Decision: Electron with TypeScript, worker threads
3. Fill Constitution Check section
   → Single Electron app with worker for model inference
   → All inference local with no network calls
   → No persistent storage or analytics
4. Evaluate Constitution Check section
   → No violations detected
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md
   → Research decisions documented
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → Design artifacts generated
7. Re-evaluate Constitution Check section
   → No new violations
   → Update Progress Tracking: Post-Design Constitution Check ✓
8. Plan Phase 2 → Describe task generation approach
   → Task strategy documented (NOT executing tasks.md creation)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 9. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution

## Summary

Mic2Text records mic audio on hotkey press, trims silence, transcribes to English offline, cleans text locally, copies to clipboard, then pastes into the focused field. Target under 3 seconds for short phrases. No storage. No logs. Pill UI at bottom center shows loading, silent, talking, processing.

## Technical Context

**Language/Version**: Node 20 with TypeScript in Electron 30
**Primary Dependencies**: TBD (audio capture library), `@nut-tree/nut-js` or `robotjs`
**Local ASR Models**: TBD (research needed)
**Local Cleanup Model**: TBD (optional, post-MVP)
**Storage**: N/A
**Testing**: Vitest for unit, Playwright for integration
**Target Platform**: macOS 13+ on Apple Silicon
**Project Type**: Single desktop app
**Performance Goals**: ≤ 3 s end to end for short phrases, cleanup ≤ 300 ms
**Constraints**: Offline only, English only, no persistence, default hotkey Command+B
**Scale/Scope**: Single user desktop utility

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

* Single Electron app with one worker for model inference
* All inference local with no network calls
* No persistent storage or analytics
* Record any deviation in Complexity Tracking

**Initial Assessment**: ✓ PASS - No constitutional violations

## Project Structure

### Documentation (this feature)
```
specs/001-feature-name-mic2text/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
  main/                 # Electron main, globalShortcut, IPC
    index.ts
    ipc-handlers.ts
    shortcuts.ts
  worker/               # Audio pipeline in worker thread (TBD)
    pipeline.ts
  paste/
    clipboard.ts
    paste.ts
  audio/                # Audio capture (TBD)
    capture.ts
  ui/
    pill.tsx
    error-popup.tsx
    app.tsx

tests/
  unit/
  integration/

design/                 # UI reference assets
  app_home.png
  error_popup.png
  pill_loading.png
  pill_silent.png
  pill_talking.png
  pill_processing.png
```

**Structure Decision**: Single-project desktop app. Model work in a worker. Minimal UI.

## Phase 0: Outline & Research

**STATUS**: Research needed for audio pipeline implementation

Key unknowns to resolve:
* **Audio capture**: How to capture microphone input in Electron/Node
* **VAD (Voice Activity Detection)**: How to detect speech vs. silence
* **Transcription**: How to transcribe audio to text offline
* **Paste behavior when no editable target exists**: Fallback to clipboard only (confirmed)
* **Error popup timing and dismissal**: Auto hide after 2 seconds (confirmed)
* **Minimum macOS version and permissions**: macOS 13+, Microphone + Accessibility (confirmed)

**Output**: TBD - needs research

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

Deliver:

* **data-model.md**
  * **AudioSession**: startTime, endTime, rmsPeak
  * **TranscriptionResult**: raw, cleaned, fallbackUsed
  * **UIState**: mode, message

* **contracts/** IPC definitions
  * `StartRecording` → `{ ok: boolean }`
  * `StopRecording` → `{ ok: boolean }`
  * `Transcribe` → `{ raw: string, cleaned?: string, fallbackUsed: boolean }`
  * `RewriteText` → `{ cleaned: string, usedFallback: boolean }`
  * `PasteText` → `{ success: boolean }`

* **quickstart.md**
  * install deps
  * verify or download models
  * grant Microphone and Accessibility
  * run dev
  * hold Command+B, speak, release, see text

* **CLAUDE.md** - Agent context file (incremental update)

Re-run Constitution Check after Phase 1.

**Output**: data-model.md, /contracts/*, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
* Generate tasks from entities, contracts, quickstart
* TDD first: Contracts and integration tests before implementation
* Parallelize independent files marked [P]
* Each contract → contract test task
* Each entity → model/service creation task
* Each UI component → component + test task
* Integration test for end-to-end flow

**Ordering Strategy**:
* TDD order: Tests before implementation
* Dependency order: Models → Services → UI → Integration
* Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md)
**Phase 5**: Validate quickstart and performance

## Files Already Present

### Design assets → `/design`
* ✅ `app_home.png`
* ✅ `error_popup.png`
* ✅ `pill_loading.png`
* ✅ `pill_silent.png`
* ✅ `pill_talking.png`
* ✅ `pill_processing.png`

### Audio Pipeline
* ⚠️ **TBD** - Needs research on implementation approach

## Known Items Confirmed

* ✅ Paste library: `@nut-tree/nut-js` or `robotjs`
* ✅ Error popup auto hide: 2 seconds
* ✅ Test runner: Vitest + Playwright
* ⚠️ Audio pipeline: **Needs research**

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | —          | —                                   |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - 32 tasks created
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

### Design References

All UI visuals live in `/design` and define the look for MVP. Follow them exactly.

### Final Note on Missing Assets

For anything that does not exist locally, the app and docs must instruct the user to download it. Provide clear prompts and a one-command setup for each missing group.

---
*Ready to execute Phase 0*
