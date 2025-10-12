# WisprFlow Marketing Site

An interactive retro desktop-themed marketing site for WisprFlow voice-to-text transcription app.

## Overview

The marketing site is designed as a fully functional desktop OS interface where users can:
- Double-click icons to open windows
- Drag icons anywhere on screen
- Drag, resize, and manage windows
- Try a live demo of voice transcription
- View pricing and sign up for accounts

## Phase 1 Status: ✅ COMPLETE

### Implemented Features

#### Core Desktop UI
- ✅ Desktop layout with retro background
- ✅ Draggable desktop icons (freely positionable, bounded to viewport)
- ✅ Double-click icons to open windows
- ✅ Taskbar with live clock, animated battery, animated network indicator

#### Window System
- ✅ Fully draggable windows (drag title bar)
- ✅ Resizable windows (8 resize handles: corners + edges)
- ✅ Close button (X)
- ✅ Double-click title bar to toggle fullscreen
- ✅ Multiple windows can be open
- ✅ Z-index management (click to bring to front)
- ✅ Boundary checking (windows stay on screen)
- ✅ Custom scrollbar styling

#### Theme System
- ✅ 4 color schemes implemented via CSS variables
  - **Option A**: Pastel Terminal (soft blue/pink)
  - **Option B**: Muted Earth Tones (sage green/beige) - DEFAULT
  - **Option C**: Terminal Green (matrix green/black)
  - **Option D**: Warm Retro (coral pink/soft yellow)
- ✅ Easily swappable via `data-theme` attribute

#### Desktop Icons
- 📓 **demo** - Interactive transcription demo (stub)
- 💰 **pricing** - Pricing tiers (stub)
- 🔐 **account** - Login/register (stub)
- 📚 **docs** - Documentation (stub)
- 🏆 **showcase** - Use cases (stub)
- ℹ️ **about** - Features (stub)
- 🗑️ **trash** - Decorative (bottom right)

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
marketing-site/
├── app/
│   ├── page.tsx              # Main desktop page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Theme system & styles
├── components/
│   └── desktop/
│       ├── Desktop.tsx       # Main desktop layout
│       ├── DesktopIcon.tsx   # Draggable desktop icons
│       ├── Window.tsx        # Draggable/resizable windows
│       └── Taskbar.tsx       # Bottom taskbar with clock, battery, network
└── stores/
    └── windowStore.ts        # Zustand state management
```

## Technical Details

**Mouse Event Handling:**
- Uses document-level mouse events (not element-level) for reliable drag/resize
- Prevents mouse cursor leaving element during drag
- Proper cleanup with useEffect

**Performance:**
- Uses `transform: translate()` instead of `top/left` for better performance
- Boundary checking on every frame
- Smooth 60fps animations

**State Management:**
- Zustand store for window positions, sizes, z-indices
- Individual icon positions managed locally

## Theme Customization

To change the theme, add the `data-theme` attribute to the root element:

```typescript
// In layout.tsx or Desktop.tsx
<div data-theme="terminal-green">
  {/* Desktop content */}
</div>
```

Available themes:
- (default) - Muted Earth Tones
- `pastel-terminal` - Soft Pastel Terminal
- `terminal-green` - Classic Terminal Green
- `warm-retro` - Warm Retro Computing

## Development

### Prerequisites
- Node 20+
- npm

### Setup
```bash
cd marketing-site
npm install
npm run dev
```

The site will be available at `http://localhost:3000`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps (Phase 2)

### Demo Window Implementation
- [ ] Port Fn key detection from WisprFlow
- [ ] Port audio recording logic
- [ ] Integrate Whisper transcription (browser-based)
- [ ] Add dot visualization
- [ ] Implement rate limiting (3s cooldown, 20 max uses)
- [ ] Device detection for edge function fallback

### Expected Timeline
- Phase 2: 3-4 hours (Demo window)
- Phase 3: 4-5 hours (Marketing windows: Pricing, Account, About)
- Phase 4: 2-3 hours (Docs, Showcase, custom icons, polish)

## Design Reference

Design inspiration: `/design/marketing_design.png`
Design document: `/docs/MARKETING_SITE_DESIGN.md`

## Browser Support

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Mobile: Shows "Coming Soon" message (desktop-only experience)

## License

Proprietary - WisprFlow
