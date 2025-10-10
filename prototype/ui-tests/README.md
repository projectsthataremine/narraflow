# Mic2Text UI Visualizations Test

Prototype app for testing different UI visualizations with simulated audio data.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.


## How It Works

1. **AudioDataProvider** - Generates fake audio amplitude data that simulates human speech patterns:
   - Silence periods (1-2%)
   - Gradual ramp up when starting to speak
   - Natural variation while speaking (30-90%)
   - Gradual fade out at end of phrase
   - Random timing to mimic real conversation

2. **Visualizations** - Each visualization component receives:
   - `amplitude` - Current amplitude (0.0-1.0)
   - `audioHistory` - Array of recent amplitude values

3. **ThickBarsVisualization** - First visualization:
   - 10 thick bars (8px wide)
   - Purple/blue gradient
   - Mirrored up and down from center
   - Time series: bars represent last 10 audio samples (~320ms)
   - Smooth animations with glow effect

## Adding New Visualizations

1. Create new component in `src/visualizations/`
2. Wrap it in `<AudioDataProvider>` in `App.jsx`
3. Access `amplitude` and `audioHistory` props
