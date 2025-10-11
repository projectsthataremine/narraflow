# Mic2Text Marketing Site

A beautiful, minimal marketing page for Mic2Text voice typing app.

## Design Philosophy

- **No Scrolling**: Single-page experience that fits on one screen
- **Clean & Minimal**: Inspired by modern design with geometric patterns
- **Brand Colors**: Custom palette extracted from the reference design
  - Teal (dark & light)
  - Orange/Terracotta
  - Purple/Violet
  - Yellow/Gold
  - Tan background

## Features

- ✅ Single-page, no-scroll design
- ✅ Interactive "Learn more" button that swaps content
- ✅ Geometric pattern matching the reference design
- ✅ Custom color palette and typography (Archivo Black + Inter)
- ✅ Fast Next.js 15 with static export capability
- ✅ Tailwind CSS v4 with custom theme
- ✅ SEO-optimized metadata

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
marketing-site/
├── app/
│   ├── globals.css       # Tailwind config with custom theme
│   ├── layout.tsx        # Root layout with metadata
│   └── page.tsx          # Home page
├── components/
│   ├── Hero.tsx          # Main hero component with content swap
│   ├── Logo.tsx          # Mic2Text logo
│   └── GeometricPattern.tsx  # Colorful geometric grid
└── public/               # Static assets
```

## Content States

The hero has two states that swap when clicking "Learn more":

### Initial State
- Headline: "Voice typing that actually works"
- CTA buttons: "Learn more" + "Try platform for free"
- Small decorative graphic

### Details State
- Headline: "It's that simple"
- Description: Simple 3-line explanation
- Pricing: "$3/month. 7-day free trial."
- CTA: "Get started"

## Color Palette

All colors are defined in `app/globals.css`:

- `tan`: #E8E3D8 (background)
- `teal-dark`: #2D5A52
- `teal-light`: #A4D4C8
- `orange`: #E8734E
- `terracotta`: #B85A3A
- `purple`: #5A3A6E
- `violet`: #7B5B8F
- `yellow`: #F4D06F
- `gold`: #D4A94F

## Typography

- **Heading Font**: Archivo Black (for large headlines)
- **Body Font**: Inter (for all other text)

Both loaded from Google Fonts.

## Building for Production

```bash
npm run build
```

The site can be statically exported for maximum speed and deployed to any static hosting service.

## Future Enhancements

- [ ] Connect "Sign up" button to authentication
- [ ] Add analytics tracking
- [ ] Implement actual sign-up flow
- [ ] Add more micro-interactions

---

Built with Next.js 15, Tailwind CSS v4, and TypeScript.
