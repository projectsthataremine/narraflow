# Animation Implementation Plan

## Overview
Building a three-layer animation system for the audio visualization bars, inspired by Wispr Flow's organic movement patterns.

## Three Animation Layers

### Layer 1: Independent Bar Oscillation ✅ (CURRENT)
**Complexity:** Easy
**Visual Impact:** Medium
**Purpose:** Makes each bar feel alive and independent

**Characteristics:**
- Each bar has its own random speed and phase offset
- Sine wave oscillation per bar
- Always active, even in silence
- Adds organic randomness on top of other effects

**Implementation:**
```javascript
const indie = sin(time * barSpeed + barPhase) * amplitude
```

---

### Layer 2: Fast Spike Wave
**Complexity:** Medium
**Visual Impact:** High
**Purpose:** Creates sharp, attention-grabbing movement

**Characteristics:**
- Single sharp spike travels left-to-right
- Duration: ~1-1.5 seconds for full traversal
- Amplitude-sensitive (tiny when silent, larger when loud)
- Immediately restarts on left when it exits right
- Sharp falloff (only affects 1-2 bars at a time)

**Implementation:**
```javascript
const spikePosition = (time * speedMultiplier) % 1  // 0-1 across bars
const distance = abs(barPosition - spikePosition)
const spike = max(0, 1 - distance * sharpness) * micAmplitude
```

**Parameters to tune:**
- `speedMultiplier`: Controls travel speed
- `sharpness`: How narrow the spike is (higher = sharper)
- Amplitude sensitivity factor

---

### Layer 3: Snake/Bulge Wave
**Complexity:** Hard
**Visual Impact:** High
**Purpose:** Creates smooth, organic "ball through tube" effect

**Characteristics:**
- Two smooth bulges traveling through bars
- Offset by half cycle (when one exits, other enters)
- Duration: ~2-3 seconds per bulge
- Gaussian/bell curve shape
- Always active

**Implementation:**
```javascript
// Two waves, offset by half the cycle
const wave1Position = (time * 0.5) % 1  // 2-second cycle
const wave2Position = (time * 0.5 + 0.5) % 1  // Offset by 50%

const distance1 = abs(barPosition - wave1Position)
const distance2 = abs(barPosition - wave2Position)

const bulge1 = exp(-distance1² * width)
const bulge2 = exp(-distance2² * width)

const snakeWave = (bulge1 + bulge2) * intensity
```

**Parameters to tune:**
- Cycle duration
- Bulge width (how wide the "ball" appears)
- Bulge intensity

---

## Combination Formula

```javascript
finalAmplitude =
  micAmplitude * 1.0 +                    // Base audio response
  independentOscillation * 0.15 +         // Organic wiggle
  fastSpike * (0.3 * micAmplitude) +      // Amplitude-sensitive spike
  snakeWave * 0.25                        // Smooth traveling bulge
```

Clamped to: `max(0.05, min(1.0, finalAmplitude))`

---

## Implementation Phases

### ✅ Phase 0: Foundation (COMPLETED)
- Working microphone input with proper amplitude detection
- GPU-accelerated animation loop using refs and CSS transforms
- Noise gate and sensitivity tuning
- Per-bar characteristics initialization

### 🔄 Phase 1: Independent Bar Oscillation (IN PROGRESS)
**Status:** Implementing now

**Steps:**
1. Add sine wave calculation per bar using barCharacteristics
2. Combine with microphone amplitude
3. Test that bars wiggle independently

**File:** `ThickBarsVisualization.jsx` lines 160-178

---

### ⏳ Phase 2: Fast Spike Wave
**Dependencies:** Phase 1 complete

**Steps:**
1. Calculate traveling spike position
2. Calculate distance from each bar to spike
3. Apply sharp falloff
4. Make amplitude-sensitive
5. Tune speed and sharpness parameters

---

### ⏳ Phase 3: Snake/Bulge Wave
**Dependencies:** Phase 2 complete (optional)

**Steps:**
1. Implement Gaussian bulge calculation
2. Create two offset wave instances
3. Combine their effects
4. Tune cycle duration and width

---

### ⏳ Phase 4: Layer Combination & Tuning
**Dependencies:** At least Phase 1 complete, ideally all phases

**Steps:**
1. Add all enabled effects together
2. Add debug toggles for each layer
3. Tune weights and parameters
4. Remove debug controls
5. Final polish

---

## Testing Strategy

### Per-Phase Testing
- Each phase should be testable independently
- Verify visual output matches expected behavior
- Check performance (should maintain 60fps)

### Debug Controls (Temporary)
Add checkboxes or keyboard shortcuts to toggle each layer:
- `1` key: Toggle independent oscillation
- `2` key: Toggle fast spike
- `3` key: Toggle snake wave
- `D` key: Show/hide debug info

### Performance Monitoring
- Animation should run at 60fps
- No React re-renders during animation (refs only)
- CSS transforms for GPU acceleration

---

## Current Status

**Completed:**
- ✅ Microphone input working
- ✅ Amplitude detection and noise gate
- ✅ GPU-accelerated animation loop
- ✅ Per-bar characteristics initialized
- ✅ All bars responding to raw amplitude

**In Progress:**
- 🔄 Phase 1: Independent Bar Oscillation

**Next Steps:**
- Phase 2: Fast Spike Wave (optional)
- Phase 3: Snake/Bulge Wave (optional)
- Phase 4: Combination & tuning

---

## Design Decisions

### Why Incremental Approach?
1. **Easier to debug:** Each effect isolated and testable
2. **Flexible stopping point:** Can stop after Phase 1 if it's "good enough"
3. **Better understanding:** Learn what works before adding complexity
4. **Performance validation:** Ensure each layer maintains 60fps

### Why Start with Independent Oscillation?
1. **Easiest to implement:** Simple sine wave math
2. **Immediate visual improvement:** Breaks the "mirror effect"
3. **Validates architecture:** Confirms animation loop is working correctly
4. **Low risk:** Won't break existing functionality

### GPU Acceleration Strategy
- Use CSS `transform: scaleY()` for bar height changes
- Update via CSS custom properties (`--amplitude`)
- Avoid React re-renders by using refs
- All calculations in requestAnimationFrame loop

---

## Parameters Reference

### Microphone Processing
- `noiseGateThreshold`: 0.003 (very light, filters background noise only)
- `sensitivityMultiplier`: 3 (sqrt-based non-linear boost)

### Animation Timing
- `animationLoop`: 60fps via requestAnimationFrame
- `microphoneUpdateRate`: ~60fps via AnalyserNode

### Bar Characteristics (Per Bar, Random)
- `speed`: 2.0 to 5.0 (oscillation speed multiplier)
- `phaseOffset`: 0 to 2π (random starting phase)

---

Last Updated: 2025-10-09
