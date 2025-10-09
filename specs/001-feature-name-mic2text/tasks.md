# Tasks: Mic2Text MVP

**Input**: Design documents from `/Users/joshuaarnold/Dev/Mic2Text/specs/001-feature-name-mic2text/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Goal**: Create an MVP version that can be tested locally

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Node 20, TypeScript, Electron 30
   → Structure: Single desktop app with worker threads
2. Load design documents:
   → data-model.md: 3 entities (AudioSession, TranscriptionResult, UIState)
   → contracts/: IPC message contracts
   → research.md: Technical decisions (Whisper Tiny, Phi-3 Mini, etc.)
   → quickstart.md: Test scenarios and validation steps
3. Generate tasks by category:
   → Setup: Project structure, dependencies, tooling
   → Tests: Contract tests, integration tests (TDD approach)
   → Core: Audio capture, VAD, transcription, cleanup, paste
   → UI: Pill component, error popup
   → Integration: IPC handlers, worker threads, permissions
   → Polish: End-to-end validation, performance testing
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
   → Models before services before UI
5. Total tasks generated: 32
6. Validation complete: All contracts tested, all entities modeled
7. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- MVP focus: Core functionality without model downloads (mock/stub initially)

---

## Phase 3.1: Setup & Project Structure

- [ ] **T001** Create project structure with Electron + TypeScript configuration
  - Initialize package.json with Electron 30, TypeScript, Vitest, Playwright
  - Create folder structure: `src/main/`, `src/worker/`, `src/rewrite/`, `src/paste/`, `src/audio/`, `src/ui/`, `tests/unit/`, `tests/integration/`, `resources/models/`
  - Add tsconfig.json for main, renderer, and worker threads
  - Files: `package.json`, `tsconfig.json`, `tsconfig.renderer.json`, `tsconfig.worker.json`

- [ ] **T002** [P] Configure build tooling and scripts
  - Add Vite for renderer bundling
  - Add electron-builder config
  - Add npm scripts: `dev`, `build`, `test`, `test:e2e`
  - Files: `vite.config.ts`, `electron-builder.json`, update `package.json`

- [ ] **T003** [P] Configure linting and formatting
  - Add ESLint + TypeScript rules
  - Add Prettier config
  - Add pre-commit hooks (optional)
  - Files: `.eslintrc.json`, `.prettierrc`, `.eslintignore`

- [ ] **T004** [P] Create shared types from contracts
  - Copy IPC contract types to `src/types/ipc-contracts.ts`
  - Export all interfaces and types
  - Add validation helpers
  - Files: `src/types/ipc-contracts.ts`

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (IPC Messages)

- [ ] **T005** [P] Contract test: StartRecording IPC message
  - Test request/response structure for `ipc:start-recording`
  - Validate response has `ok: boolean` and optional `error: string`
  - Files: `tests/unit/ipc/start-recording.test.ts`

- [ ] **T006** [P] Contract test: StopRecording IPC message
  - Test request/response for `ipc:stop-recording`
  - Validate `audioSession` structure if ok=true
  - Files: `tests/unit/ipc/stop-recording.test.ts`

- [ ] **T007** [P] Contract test: Transcribe worker message
  - Test worker message format for transcription
  - Validate `TranscriptionResult` response structure
  - Files: `tests/unit/worker/transcribe.test.ts`

- [ ] **T008** [P] Contract test: VADUpdate event
  - Test VAD probability event format
  - Validate probability is [0,1]
  - Files: `tests/unit/events/vad-update.test.ts`

- [ ] **T009** [P] Contract test: PasteText message
  - Test paste request/response structure
  - Validate success boolean in response
  - Files: `tests/unit/ipc/paste-text.test.ts`

### Integration Tests (User Scenarios)

- [ ] **T010** [P] Integration test: Complete recording flow (mocked models)
  - Test: Press hotkey → record → release → clipboard update
  - Use mock audio input and mock transcription
  - Validate UI state transitions: hidden → loading → silent → processing → hidden
  - Files: `tests/integration/recording-flow.test.ts`

- [ ] **T011** [P] Integration test: Silence-only recording
  - Test: Record silence (RMS < -40dB) → no clipboard/paste
  - Validate system does nothing when only silence detected
  - Files: `tests/integration/silence-handling.test.ts`

- [ ] **T012** [P] Integration test: Error handling
  - Test: Mic unavailable → error popup shown for 2s
  - Test: Transcription fails → error popup shown
  - Files: `tests/integration/error-handling.test.ts`

- [ ] **T013** [P] Integration test: No focused text field
  - Test: Recording succeeds but no text input focused → clipboard only
  - Validate no paste attempt, text in clipboard
  - Files: `tests/integration/clipboard-fallback.test.ts`

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Audio Pipeline (Worker Thread)

⚠️ **BLOCKED**: Requires research on audio capture, VAD, and transcription implementation

- [ ] **T014** Research and implement audio pipeline
  - Phase 1: Microphone capture
  - Phase 2: VAD (Voice Activity Detection)
  - Phase 3: Transcription to text
  - Files: TBD based on research

### Clipboard & Paste

- [ ] **T023** [P] Clipboard manager
  - Implement clipboard copy using Electron clipboard API
  - Files: `src/paste/clipboard.ts`

- [ ] **T024** [P] Paste simulation module
  - Use @nut-tree/nut-js to simulate Cmd+V
  - Detect focused text field using Accessibility API
  - Fallback to clipboard-only if no text field focused
  - Files: `src/paste/paste.ts`

### UI Components

- [ ] **T025** [P] Pill UI component
  - Create React/Preact component with 4 states: loading, silent, talking, processing
  - Position at bottom-center of screen
  - Animate based on VAD probability
  - Use design assets from `/design/pill_*.png` (or CSS for MVP)
  - Files: `src/ui/pill.tsx`

- [ ] **T026** [P] Error popup component
  - Create popup component with "Error, please try again" message
  - Auto-hide after 2 seconds
  - Position at bottom-center
  - Files: `src/ui/error-popup.tsx`

- [ ] **T027** Renderer app entry point
  - Create React app rendering Pill and ErrorPopup
  - Subscribe to UI state updates via IPC
  - Files: `src/ui/app.tsx`, `src/ui/index.tsx`

---

## Phase 3.4: Integration & Electron Main

- [ ] **T028** IPC handlers in main process
  - Implement `ipc:start-recording` handler → call audio capture
  - Implement `ipc:stop-recording` handler → finalize session, send to worker
  - Implement `ipc:paste-text` handler → call clipboard + paste modules
  - Files: `src/main/ipc-handlers.ts`

- [ ] **T029** Global hotkey registration
  - Register Command+B using Electron globalShortcut
  - Check Accessibility permission before registering
  - Trigger start/stop recording on press/release
  - Files: `src/main/shortcuts.ts`

- [ ] **T030** Electron main entry point
  - Create main window (hidden by default)
  - Initialize IPC handlers
  - Register global shortcuts
  - Spawn worker thread
  - Files: `src/main/index.ts`

- [ ] **T031** [P] Permission checking utilities
  - Check Microphone permission status
  - Check Accessibility permission for hotkey + paste
  - Show instructions if permissions not granted
  - Files: `src/main/permissions.ts`

---

## Phase 3.5: Polish & Validation

- [ ] **T032** End-to-end validation following quickstart.md
  - Run `npm run dev`
  - Test core flow: Press Cmd+B → speak → release → verify clipboard/paste
  - Test silence-only recording → verify no action taken
  - Test error scenarios → verify 2s popup
  - Document any issues for post-MVP fixes
  - Files: Create `TESTING.md` with validation results

---

## Dependencies

### Critical Path:
1. **Setup (T001-T004)** must complete first
2. **Tests (T005-T013)** must be written and failing before implementation
3. **Core modules (T014-T024)** can run in parallel once tests exist
4. **UI (T025-T027)** depends on IPC contracts (T004)
5. **Integration (T028-T031)** depends on core modules
6. **Validation (T032)** is last

### Blocking Relationships:
- T001 blocks all other tasks
- T004 blocks T005-T013 (tests need types)
- T005-T013 block implementation tasks (TDD: tests before impl)
- **T014 blocks all audio-dependent features** (audio pipeline research needed)
- T023 + T024 block T028 (IPC handler needs paste modules)
- T025 + T026 block T027 (app needs components)
- T028 + T029 + T030 block T032 (validation needs running app)

---

## Parallel Execution Examples

### Batch 1: Setup (Sequential)
```bash
# T001: Must run first to create structure
Task: "Create project structure with Electron + TypeScript configuration"
```

### Batch 2: Setup Parallel (after T001)
```bash
# T002-T004 can run together (different files)
Task: "Configure build tooling and scripts - vite.config.ts, electron-builder.json"
Task: "Configure linting and formatting - .eslintrc.json, .prettierrc"
Task: "Create shared types from contracts - src/types/ipc-contracts.ts"
```

### Batch 3: Contract Tests (after T004)
```bash
# T005-T009 can run together (different test files)
Task: "Contract test: StartRecording IPC message - tests/unit/ipc/start-recording.test.ts"
Task: "Contract test: StopRecording IPC message - tests/unit/ipc/stop-recording.test.ts"
Task: "Contract test: Transcribe worker message - tests/unit/worker/transcribe.test.ts"
Task: "Contract test: VADUpdate event - tests/unit/events/vad-update.test.ts"
Task: "Contract test: PasteText message - tests/unit/ipc/paste-text.test.ts"
```

### Batch 4: Integration Tests (after T004)
```bash
# T010-T013 can run together (different test files)
Task: "Integration test: Complete recording flow - tests/integration/recording-flow.test.ts"
Task: "Integration test: Silence-only recording - tests/integration/silence-handling.test.ts"
Task: "Integration test: Error handling - tests/integration/error-handling.test.ts"
Task: "Integration test: No focused text field - tests/integration/clipboard-fallback.test.ts"
```

### Batch 5: Non-Audio Modules (after tests T005-T013 failing)
```bash
# T023-T026 can run together (independent files)
Task: "Clipboard manager - src/paste/clipboard.ts"
Task: "Paste simulation - src/paste/paste.ts"
Task: "Pill UI component - src/ui/pill.tsx"
Task: "Error popup component - src/ui/error-popup.tsx"
```

### Batch 6: Audio Pipeline (BLOCKED - needs research)
```bash
# T014: Research audio pipeline implementation
# Cannot proceed until research complete
```

### Batch 7: Integration (after core modules)
```bash
# T028-T031 some sequential, T031 parallel
Task: "IPC handlers - src/main/ipc-handlers.ts"  # Needs T023-T024
Task: "Global hotkey registration - src/main/shortcuts.ts"
Task: "Electron main entry point - src/main/index.ts"  # Needs T028-T029
Task: "Permission checking utilities - src/main/permissions.ts"  # [P]
```

---

## MVP Scope Notes

⚠️ **Audio Pipeline: RESEARCH NEEDED**

**Current Status**:
- ✅ Electron app structure defined
- ✅ IPC contracts defined
- ✅ UI design complete (pill + error popup)
- ✅ Clipboard/paste approach confirmed
- ❌ **Audio pipeline implementation: BLOCKED pending research**

**Needs Research**:
1. How to capture microphone audio
2. How to implement VAD (Voice Activity Detection)
3. How to transcribe audio to text offline

**Working Components** (can implement now):
1. Electron app structure
2. Global hotkey (Cmd+B)
3. IPC communication (main ↔ renderer ↔ worker)
4. Clipboard + paste simulation
5. UI (pill + error popup)
6. Permission checks

**Performance Targets**:
- End-to-end: <3s for short phrases (pending audio pipeline implementation)

---

## Validation Checklist
*GATE: Verified before marking tasks complete*

- [x] All IPC contracts have corresponding tests (T005-T009)
- [x] All entities have implementation tasks (AudioSession: T015, TranscriptionResult: T020, UIState: T027)
- [x] All tests come before implementation (T005-T013 before T014-T031)
- [x] Parallel tasks are truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task

---

## Task Execution Strategy

1. **Start with T001** to create project structure
2. **Run T002-T004 in parallel** for setup
3. **Run T005-T013 in parallel** to write all tests (they will fail)
4. **Verify tests fail** before proceeding
5. **Run T014-T026 in parallel** for core implementation
6. **Run T017-T020 sequentially** for pipeline (has dependencies)
7. **Run T027** to wire up UI
8. **Run T028-T031** for Electron integration
9. **Run T032** for final validation

**Estimated MVP completion**: 8-12 hours for experienced developer

---

*Tasks ready for execution. Begin with T001.*
