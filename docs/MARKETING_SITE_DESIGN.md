# WisprFlow Marketing Site Design Document

**Last Updated:** 2025-10-11
**Status:** Ready for Implementation
**Design Inspiration:** `design/marketing_design.png`

---

## Overview

The WisprFlow marketing site is designed as an interactive retro desktop experience. The entire site mimics a simplified desktop operating system where navigation happens through "windows" opened by double-clicking desktop icons. This creates a unique, memorable experience that lets users actually try the core transcription feature directly in their browser.

---

## Design Philosophy

- **Simplified Retro OS**: Inspired by early desktop systems but more minimal and clean
- **Not Windows 95 Clone**: Avoid cliche retro look - create our own aesthetic
- **Modern but Retro**: Clean, purposely simplified, slightly ridiculous (in a good way)
- **Interactive Demo First**: The working transcription demo is the hero feature
- **Desktop-Only Focus**: Mobile shows "Coming Soon" message

---

## Color Schemes

### Active Theme System
All themes must be easily swappable via CSS variables or theme provider.

#### Option A: Soft Pastel Terminal (Starting Default)
```css
--bg: #1e1e2e (dark charcoal)
--accent: #89b4fa (soft blue)
--secondary: #f5c2e7 (light pink)
--text: #cdd6f4 (light gray)
```
**Vibe:** Synthwave meets terminal

#### Option B: Muted Earth Tones (Recommended)
```css
--bg: #2e3440 (dark slate)
--accent: #a3be8c (sage green)
--secondary: #ebcb8b (warm beige)
--text: #eceff4 (off-white)
```
**Vibe:** Natural, calm, readable

#### Option C: Classic Terminal Green
```css
--bg: #0c0c0c (true black)
--accent: #00ff41 (matrix green)
--secondary: #33ff77 (lighter green)
--text: #00cc33 (terminal green)
```
**Vibe:** Hacker aesthetic, high contrast

#### Option D: Warm Retro Computing
```css
--bg: #2d2a2e (warm dark gray)
--accent: #ff6188 (coral pink)
--secondary: #ffd866 (soft yellow)
--text: #fcfcfa (cream white)
```
**Vibe:** 80s computing, warm and inviting

**Starting Theme:** Option B (Muted Earth Tones)

---

## Desktop Layout

### Desktop Structure
```
┌─────────────────────────────────────────────────────────┐
│ ○ ○ ○                                      [Title Bar]  │ <- Optional window chrome
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📓 demo        🏆 showcase      💰 pricing             │
│                                                          │
│                                                          │
│  📚 docs        ℹ️ about         🔐 account             │
│                                                          │
│                                                          │
│                                  🗑️ trash               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ [contact us]                    🔋 ◐ EN         20:15  │ <- Taskbar
└─────────────────────────────────────────────────────────┘
```

### Desktop Icons

Icons are **freely draggable anywhere on the screen**:
- Not locked to a grid
- Can be positioned anywhere
- Cannot be dragged off-screen (bounded)
- Boundaries checked on all edges during drag

**Icon List:**
1. **demo** - Notepad with working transcription (Primary CTA)
2. **pricing** - Subscription tiers and checkout
3. **account** - Login/register/dashboard
4. **docs** - Quick start guide and documentation
5. **showcase** - Use cases and testimonials
6. **about** - Features and how it works
7. **trash** - Bottom right, decorative (no function for now)

**Icon Style:**
- Custom SVG or CSS-based icons
- NOT Windows 95/98 icons (avoiding cliche)
- Simple, minimal, modern-retro aesthetic
- Black/white with accent color highlights

---

## Taskbar

### Left Section
- `[contact us]` button - Opens contact form or email link

### Right Section (Status Area)
- **Battery Indicator**: Animated, decreases 1% every 1 minute, resets to 100% at 0%
- **Network Indicator**: Shows bars, loses 1 bar every 30 seconds for 2 seconds, then recovers
- **Language**: `EN` (static for now)
- **Clock**: Live time in `HH:MM` format

---

## Window System

### Window Component Structure

```
┌────────────────────────────────────────┐
│ window-name                          X │ <- Title bar
├────────────────────────────────────────┤
│                                         │
│  [Window content goes here]            │
│                                         │
│                                         │
└────────────────────────────────────────┘
```

### Window Features

**Title Bar:**
- Left: Window name (e.g., "demo", "pricing", "account")
- Right: Close button (X)
- Double-click title bar: Full-screen toggle

**Behaviors:**
- ✅ Draggable by title bar
- ✅ Resizable by edges/corners
- ✅ Close via X button
- ✅ Full-screen on double-click title bar
- ✅ Click window brings to front (z-index management)
- ✅ Multiple windows can be open simultaneously
- ❌ NO minimize
- ❌ NO maximize button
- ❌ NO clicking outside to close (must use X button)

**Boundaries:**
- Windows cannot be dragged off-screen
- All edges bounded to viewport
- Checked during drag operations

**Custom Scrollbar:**
- Styled to match retro aesthetic (similar to design inspiration)
- CSS-based using `::-webkit-scrollbar` pseudo-elements

---

## Window Content Pages

### 1. Demo Window (Priority: HIGHEST)

**Content:** Interactive notepad with working voice transcription

**Layout:**
```
┌────────────────────────────────────────┐
│ demo                                 X │
├────────────────────────────────────────┤
│ Press and hold Fn to speak...         │
│                                         │
│ [Textarea - transcribed text here]    │
│                                         │
│ ● ● ● ○ ○  [when recording]           │
│                                         │
└────────────────────────────────────────┘
```

**Features:**
- Large textarea for text input/output
- Fn key detection (existing code from WisprFlow)
- Audio recording with visualization (dots)
- Real Whisper transcription (browser-based)
- Text insertion into textarea
- Instructions: "Press and hold Fn to speak..."

**Technical Requirements:**
- Port existing Fn key detection code
- Port existing audio recording code
- Integrate Whisper for browser (use existing WisprFlow React code)
- Rate limiting: 3-second cooldown between uses
- Usage limit: Max 20 transcriptions per session
- Device detection: Use edge function for low-power devices, local for capable devices

**No Features:**
- No menu bar (File, Edit, Help)
- No LLM integration
- No system-wide paste

---

### 2. Pricing Window (Priority: HIGH)

**Content:** Subscription tiers with Stripe checkout

**Layout:**
```
┌────────────────────────────────────────┐
│ pricing                              X │
├────────────────────────────────────────┤
│  FREE TIER          PRO TIER          │
│  ┌──────────┐      ┌──────────┐      │
│  │ $0/mo    │      │ $X/mo    │      │
│  │ • Feature│      │ • Feature│      │
│  │ • Feature│      │ • Feature│      │
│  └──────────┘      └──────────┘      │
│  [Start Free]      [Buy Pro]         │
│                                         │
└────────────────────────────────────────┘
```

**Components:**
- Pricing cards (Free, Pro tiers)
- Feature comparison
- CTA buttons → Stripe checkout
- Clear value proposition

---

### 3. Account Window (Priority: HIGH)

**Content:** Login/register and user dashboard

**Layout:**
```
┌────────────────────────────────────────┐
│ account                              X │
├────────────────────────────────────────┤
│  [Login] [Register]                    │
│  ┌──────────────────────────────────┐ │
│  │ Email: [____________]            │ │
│  │ Password: [____________]         │ │
│  │ [Login Button]                   │ │
│  └──────────────────────────────────┘ │
│                                         │
└────────────────────────────────────────┘
```

**Features:**
- Tab switcher: Login / Register
- Email + password inputs
- Supabase authentication
- Post-login: Dashboard showing license key, download link, subscription status

---

### 4. About Window (Priority: MEDIUM)

**Content:** Features and how WisprFlow works

**Layout:**
```
┌────────────────────────────────────────┐
│ about                                X │
├────────────────────────────────────────┤
│  What is WisprFlow?                    │
│  Voice-to-text transcription...        │
│                                         │
│  Features:                             │
│  • Local-first privacy                 │
│  • Fast transcription                  │
│  • System-wide shortcuts               │
│                                         │
└────────────────────────────────────────┘
```

---

### 5. Docs Window (Priority: MEDIUM)

**Content:** Quick start guide and documentation

**Layout:**
```
┌────────────────────────────────────────┐
│ docs                                 X │
├────────────────────────────────────────┤
│ [Sidebar]      │ Content Area          │
│ • Quick Start  │ # Getting Started     │
│ • Install      │ 1. Download app       │
│ • Shortcuts    │ 2. Install...         │
│ • FAQ          │                        │
│                │                        │
└────────────────────────────────────────┘
```

**Features:**
- Sidebar navigation
- Markdown content rendering
- Code blocks with syntax highlighting

---

### 6. Showcase Window (Priority: LOW)

**Content:** Use cases, testimonials, demos

**Layout:**
```
┌────────────────────────────────────────┐
│ showcase                             X │
├────────────────────────────────────────┤
│  Use Cases:                            │
│  ┌──────────┐  ┌──────────┐          │
│  │ Writers  │  │Developer │          │
│  │ [image]  │  │ [image]  │          │
│  └──────────┘  └──────────┘          │
│                                         │
└────────────────────────────────────────┘
```

---

## Technical Implementation

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + CSS custom properties for theming
- **State Management:** Zustand
- **Window System:** Custom React components (no library)
- **Audio/Transcription:**
  - Existing WisprFlow code (port from Electron app)
  - Whisper in browser (use existing implementation)
  - Web Audio API
- **Auth:** Supabase Auth
- **Payments:** Stripe Checkout
- **Hosting:** Vercel

### Project Structure
```
marketing-site/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Desktop home
│   │   └── globals.css
│   ├── components/
│   │   ├── desktop/
│   │   │   ├── Desktop.tsx
│   │   │   ├── DesktopIcon.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── Window.tsx
│   │   ├── windows/
│   │   │   ├── DemoWindow.tsx
│   │   │   ├── PricingWindow.tsx
│   │   │   ├── AccountWindow.tsx
│   │   │   ├── DocsWindow.tsx
│   │   │   ├── ShowcaseWindow.tsx
│   │   │   └── AboutWindow.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── lib/
│   │   ├── transcription/
│   │   │   ├── whisper.ts
│   │   │   ├── audio-recorder.ts
│   │   │   └── fn-key-detector.ts
│   │   └── supabase.ts
│   ├── hooks/
│   │   ├── useWindowManager.ts
│   │   └── useTranscription.ts
│   └── stores/
│       └── windowStore.ts (Zustand)
└── public/
    └── icons/
```

### Custom Window System Implementation

**Mouse Event Handling:**
- `onMouseDown` on element (title bar or resize handle)
- `onMouseMove` on **document** (not element!)
- `onMouseUp` on **document** (not element!)
- Critical: Mouse events must be on document to handle mouse leaving element during drag

**Drag Implementation:**
```typescript
// Pseudo-code
onMouseDown (on title bar) => {
  add mousemove listener to document
  add mouseup listener to document
  track initial mouse position
}

onMouseMove (on document) => {
  calculate delta
  update window position (transform, not top/left)
  check boundaries, constrain to viewport
}

onMouseUp (on document) => {
  remove mousemove listener
  remove mouseup listener
}
```

**Resize Implementation:**
```typescript
// 8 resize handles: corners (4) + edges (4)
// Same pattern as drag
// Update width/height based on handle direction
```

**Positioning:**
- Use CSS `transform: translate()` instead of `top/left` for better performance
- All position/size calculations in pixels
- Boundary checking on every frame during drag/resize

---

## Window State Management (Zustand)

```typescript
interface WindowState {
  id: string
  name: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  zIndex: number
  isFullscreen: boolean
  isOpen: boolean
}

interface WindowStore {
  windows: WindowState[]
  activeWindowId: string | null
  openWindow: (id: string) => void
  closeWindow: (id: string) => void
  bringToFront: (id: string) => void
  updatePosition: (id: string, position: Position) => void
  updateSize: (id: string, size: Size) => void
  toggleFullscreen: (id: string) => void
}
```

---

## Icon System

### Icon Types
All icons are custom-designed, NOT Windows 95 icons.

**Style Guide:**
- Simple geometric shapes
- Monochrome with accent color
- 64x64px or SVG scalable
- Consistent stroke width
- Minimal detail

**Icon Specifications:**
1. **demo** - Notepad/document icon
2. **pricing** - Dollar sign or price tag
3. **account** - User profile or lock icon
4. **docs** - Book or document stack
5. **showcase** - Gallery grid or star
6. **about** - Info "i" or question mark
7. **trash** - Waste bin

---

## Theming System

### CSS Custom Properties

```css
:root {
  --color-bg: #2e3440;
  --color-accent: #a3be8c;
  --color-secondary: #ebcb8b;
  --color-text: #eceff4;
  --color-window-bg: #1e1e1e;
  --color-window-border: #444;
  --color-taskbar-bg: #1a1a1a;

  /* Scrollbar */
  --scrollbar-width: 14px;
  --scrollbar-track: #2e3440;
  --scrollbar-thumb: #a3be8c;
}

[data-theme="terminal-green"] {
  --color-bg: #0c0c0c;
  --color-accent: #00ff41;
  /* ... */
}
```

### Theme Switcher
- Hidden toggle in taskbar (click clock 3 times?)
- Or expose in about window
- Persists to localStorage

---

## Taskbar Animations

### Battery Indicator
```typescript
// Decreases 1% per minute
// 0% → resets to 100%
setInterval(() => {
  battery = Math.max(0, battery - 1)
  if (battery === 0) battery = 100
}, 60000)
```

### Network Indicator
```typescript
// Full bars → loses 1 bar for 2 seconds → recovers
// Every 30 seconds
setInterval(() => {
  bars = maxBars - 1
  setTimeout(() => {
    bars = maxBars
  }, 2000)
}, 30000)
```

---

## Mobile Experience

For viewport width < 1024px (tablet and below):
- Hide desktop interface
- Show centered message: "Coming Soon - Desktop version only"
- Optional: Link to download desktop app
- No attempt at responsive desktop UI

---

## Implementation Phases

### Phase 1: Core Desktop UI (Week 1)
1. Next.js project setup
2. Desktop layout component
3. Draggable icons (free positioning)
4. Taskbar with live clock
5. Window component (drag, resize, close, fullscreen)
6. Theme system (CSS variables)
7. Zustand window state management

**Deliverable:** Working desktop with dummy windows

---

### Phase 2: Demo Window (Week 2)
1. Notepad UI component
2. Port Fn key detection from WisprFlow
3. Port audio recording from WisprFlow
4. Integrate Whisper transcription
5. Dot visualization
6. Rate limiting (3s cooldown)
7. Usage limit (20 max)
8. Device detection (edge function vs local)

**Deliverable:** Working voice transcription demo

---

### Phase 3: Marketing Windows (Week 3)
1. Pricing window + Stripe integration
2. Account window + Supabase auth
3. About window (features/value prop)
4. Custom scrollbar styling

**Deliverable:** Full marketing site with checkout

---

### Phase 4: Content & Polish (Week 4)
1. Docs window with markdown rendering
2. Showcase window with use cases
3. Custom icons (SVG)
4. Taskbar animations (battery, network)
5. Window animations and transitions
6. Performance optimization
7. Mobile "Coming Soon" page

**Deliverable:** Production-ready site

---

## Design Constraints & Guidelines

### Visual Consistency
- All windows have same title bar style
- Consistent spacing: 16px padding inside windows
- Font: Monospace (e.g., "SF Mono", "Consolas", "Monaco")
- Border radius: 0px (sharp corners for retro feel)
- Shadows: Minimal or none (flat design)

### Interaction Patterns
- Double-click icon: Open window
- Single-click icon: Highlight (optional)
- Drag title bar: Move window
- Drag edges/corners: Resize window
- Double-click title bar: Fullscreen toggle
- Click X: Close window
- Click window: Bring to front

### Performance Targets
- 60fps window dragging
- < 100ms Fn key response time
- < 3s transcription time (for short clips)
- First paint < 1s

---

## Risk Mitigation

### Technical Risks
1. **Whisper performance in browser**
   - Use smaller model (tiny or base)
   - Show loading state
   - Fallback to edge function for slow devices

2. **Window drag jank**
   - Use `transform` not `top/left`
   - `will-change: transform` on active drag
   - RequestAnimationFrame for smooth updates

3. **Memory leaks from event listeners**
   - Always cleanup listeners on unmount
   - Use `useEffect` cleanup functions
   - Document-level listeners removed properly

### UX Risks
1. **Users don't understand double-click**
   - Add subtle hover animation on icons
   - Show "Double-click to open" tooltip on first visit
   - Pulsing animation on demo icon

2. **Too many windows confusing**
   - Accept this - users caused it
   - OR auto-close windows when opening new one
   - OR limit to 3 windows max

---

## Success Metrics

### User Engagement
- % of visitors who try demo
- Average demo uses per session
- Time spent on site
- Window interaction rate

### Conversion
- Demo → Pricing click rate
- Pricing → Account signup rate
- Account → Purchase rate

### Technical Performance
- Lighthouse score > 90
- Core Web Vitals: Green
- 60fps animations
- < 3s transcription time

---

## Open Questions

1. ~~Color scheme selection~~ → Starting with Option B, all options implemented as themes
2. ~~Icon style~~ → Custom SVG/CSS, NOT Windows 95
3. ~~Window dragging~~ → Custom implementation with document-level mouse events
4. ~~Whisper integration~~ → Port existing WisprFlow React code
5. ~~Mobile strategy~~ → "Coming Soon" message only
6. ~~Click outside to close?~~ → NO, only X button closes

---

## Next Steps

1. ✅ Create this design document
2. ⏳ Initialize Next.js project
3. ⏳ Build core desktop UI components
4. ⏳ Implement window system
5. ⏳ Port WisprFlow transcription code
6. ⏳ Build marketing windows
7. ⏳ Polish and deploy

---

## References

- Design Inspiration: `/design/marketing_design.png`
- Existing WisprFlow Code: `/src` (React components)
- Audio Pipeline: `/docs/audio-pipeline.md`
- Payment Integration: `/docs/PAYMENT_AND_LICENSING_INTEGRATION_V2.md`

---

**End of Document**
