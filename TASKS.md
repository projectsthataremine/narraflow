# Mic2Text - Tasks

**Source of Truth for Development Priorities**

---

## ✅ Phase 1: UI Prototyping (COMPLETE)
- [x] Create visualization presets UI
- [x] Add Settings App UI prototype
- [x] Build Recording Pill configuration panel
- [x] Add live preview with dark/light mode toggle
- [x] Integrate icon library (Lucide React)

---

## 🚀 Phase 2: Electron App Foundation (IN PROGRESS)

### 2.1 Basic Electron Setup
- [ ] Configure Electron app to hide from dock
- [ ] Implement window close behavior (hide, don't quit)
- [ ] Set up background process (no dock icon)
- [ ] Test red button (X) - should hide window, not quit app

### 2.2 Hotkey Integration (Command+B)
- [ ] Set up global hotkey listener (Command+B)
- [ ] Create overlay window that appears on hotkey press
- [ ] Position overlay window at bottom-center of screen
- [ ] Test hotkey show/hide behavior

### 2.3 Recording Pill UI in Electron
- [ ] Port Recording Pill visualization to Electron overlay
- [ ] Show static bars visualization in overlay
- [ ] Connect settings from Settings App to Recording Pill display
- [ ] Verify settings persist and apply to overlay

---

## 📋 Phase 3: Audio Pipeline (NEXT)
- [ ] Set up microphone access and permissions
- [ ] Implement basic audio capture on Command+B press
- [ ] Connect audio levels to Recording Pill bars (animated)
- [ ] Add VAD (Voice Activity Detection) - silence vs talking states
- [ ] Test end-to-end: Press Command+B → See animated bars → Release → Stop

---

## 🎙️ Phase 4: Transcription Pipeline (FUTURE)
- [ ] Integrate Whisper ONNX model
- [ ] Trim silence from audio
- [ ] Transcribe audio to text
- [ ] Add processing state to Recording Pill UI
- [ ] Copy transcribed text to clipboard
- [ ] Paste text into focused field

---

## 🤖 Phase 5: AI Text Cleanup (FUTURE)
- [ ] Integrate LLM for text cleanup (optional)
- [ ] Add fallback to raw transcription
- [ ] Connect to AI toggle in Settings App

---

## 👤 Phase 6: Account System (FUTURE)
- [ ] Design marketing/landing page
- [ ] Build account management web app
- [ ] Implement device/key management
- [ ] Add account check logic in Electron app
- [ ] Handle subscription state ($5/month)

---

## 📝 Notes
- Focus on getting Command+B → overlay working first
- Settings App should control Recording Pill appearance
- Don't quit app when closing window (hide instead)
- No dock icon - app runs in background only
