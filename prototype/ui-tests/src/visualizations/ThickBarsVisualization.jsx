import React, { useState, useEffect, useRef } from 'react';

/**
 * ThickBarsVisualization
 *
 * Displays 8-10 thick bars with gradient that mirror amplitude up and down
 * Based on real-time audio amplitude from AudioDataProvider OR real microphone
 *
 * Features:
 * - 10 thick bars (no background/pill shape)
 * - Gradient coloring
 * - Mirrored animation (up and down from center)
 * - Optional real microphone input with GPU-accelerated animation
 */
function ThickBarsVisualization({ amplitude = 0, audioHistory = [], config }) {
  const [useRealMic, setUseRealMic] = useState(false);
  const [realAmplitude, setRealAmplitude] = useState(0);
  const [micError, setMicError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameId = useRef(null);
  const mediaStreamRef = useRef(null);
  const realAmplitudeRef = useRef(0); // Store amplitude in ref for animation loop
  const smoothedAmplitudeRef = useRef(0); // Smoothed version with decay

  // Store config values in ref so animation loop can read them without restarting
  const configRef = useRef({
    attackSpeed: 0.3,
    releaseSpeed: 0.035,
    oscillationAmount: 0.08,
    oscillationSpeed: 2.5,
    spikeSpeed: 1.0,
    spikeIntensity: 0.3,
  });

  // Use config or defaults
  const NUM_BARS = config?.numBars || 10;
  const BAR_WIDTH = config?.barWidth || 8;
  const BAR_GAP = config?.barGap || 4;
  const MAX_HEIGHT = config?.maxHeight || 60;
  const BORDER_RADIUS = config?.borderRadius || 4;
  const GLOW_INTENSITY = config?.glowIntensity !== undefined ? config.glowIntensity : 20;
  const COLOR1 = config?.color1 || '#a855f7';
  const COLOR2 = config?.color2 || '#60a5fa';
  const COLOR_MODE = config?.colorMode || 'gradient';

  // Refs for GPU-accelerated animation
  const barRefs = useRef([]);
  const barCharacteristics = useRef([]);

  // Sync configRef when config changes (no animation restart)
  useEffect(() => {
    configRef.current = {
      attackSpeed: config?.attackSpeed !== undefined ? config.attackSpeed : 0.3,
      releaseSpeed: config?.releaseSpeed !== undefined ? config.releaseSpeed : 0.035,
      oscillationAmount: config?.oscillationAmount !== undefined ? config.oscillationAmount : 0.08,
      oscillationSpeed: config?.oscillationSpeed !== undefined ? config.oscillationSpeed : 2.5,
      spikeSpeed: config?.spikeSpeed !== undefined ? config.spikeSpeed : 1.0,
      spikeIntensity: config?.spikeIntensity !== undefined ? config.spikeIntensity : 0.3,
    };
  }, [config]);

  // Initialize bar characteristics once
  useEffect(() => {
    if (barCharacteristics.current.length === 0) {
      barCharacteristics.current = Array.from({ length: NUM_BARS }, () => ({
        speed: 2.0 + Math.random() * 3.0,
        phaseOffset: Math.random() * Math.PI * 2,
      }));
    }
  }, [NUM_BARS]);

  // Start/stop microphone
  useEffect(() => {
    if (useRealMic) {
      startMicrophone();
    } else {
      stopMicrophone();
    }

    return () => stopMicrophone();
  }, [useRealMic]);

  const startMicrophone = async () => {
    try {
      console.log('[Mic] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      console.log('[Mic] Microphone access granted');

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      console.log('[Mic] AudioContext created, sample rate:', audioContextRef.current.sampleRate);

      const source = audioContextRef.current.createMediaStreamSource(stream);
      console.log('[Mic] Media stream source created');

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8; // Increased smoothing to reduce jitter
      console.log('[Mic] AnalyserNode created, fftSize:', analyserRef.current.fftSize);

      source.connect(analyserRef.current);
      console.log('[Mic] Audio graph connected');

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      console.log('[Mic] Data array size:', dataArray.length);

      let frameCount = 0;
      const updateAmplitude = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Apply very light noise gate (ignore background noise below 0.003)
        const gatedRMS = Math.max(0, rms - 0.003);

        // Non-linear boost: sqrt makes quiet sounds louder, loud sounds not too loud
        // Then multiply by 3 for good range without always hitting 1.0
        const amplitude = Math.min(1.0, Math.sqrt(gatedRMS) * 3);

        // Log every 60 frames (~1 second)
        if (frameCount % 60 === 0) {
          console.log('[Mic] RMS:', rms.toFixed(4), 'Gated:', gatedRMS.toFixed(4), 'Amplitude:', amplitude.toFixed(4));
        }
        frameCount++;

        // Update both state (for display) and ref (for animation loop)
        setRealAmplitude(amplitude);
        realAmplitudeRef.current = amplitude;
        animationFrameId.current = requestAnimationFrame(updateAmplitude);
      };

      updateAmplitude();
      setMicError(null);
      console.log('[Mic] Started amplitude monitoring');
    } catch (error) {
      console.error('[Mic] Error:', error);
      setMicError(error.message);
      setUseRealMic(false);
    }
  };

  const stopMicrophone = () => {
    console.log('[Mic] Stopping microphone...');

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.error('[Mic] Error closing context:', err));
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setRealAmplitude(0);
    realAmplitudeRef.current = 0;
    smoothedAmplitudeRef.current = 0;
    console.log('[Mic] Microphone stopped');
  };

  // GPU-accelerated animation (only when using real mic)
  useEffect(() => {
    if (!useRealMic) return;

    console.log('[Animation] Starting animation loop');
    let localAnimationId = null;
    let frameCount = 0;

    const animate = () => {
      const time = Date.now() / 1000; // Current time in seconds
      const rawAmplitude = realAmplitudeRef.current;

      // Read config from ref (no need to extract from config prop)
      const attackSpeed = configRef.current.attackSpeed;
      const releaseSpeed = configRef.current.releaseSpeed;
      const oscAmount = configRef.current.oscillationAmount;
      const oscSpeed = configRef.current.oscillationSpeed;
      const spikeSpeed = configRef.current.spikeSpeed;
      const spikeIntensity = configRef.current.spikeIntensity;

      // Debug: log config values once
      if (frameCount === 1) {
        console.log('[Config Debug] attack:', attackSpeed, 'release:', releaseSpeed, 'oscAmount:', oscAmount, 'oscSpeed:', oscSpeed, 'spikeSpeed:', spikeSpeed, 'spikeIntensity:', spikeIntensity);
      }

      if (rawAmplitude > smoothedAmplitudeRef.current) {
        // Attack: quickly rise to new value
        smoothedAmplitudeRef.current += (rawAmplitude - smoothedAmplitudeRef.current) * attackSpeed;
      } else {
        // Release: slowly decay
        smoothedAmplitudeRef.current += (rawAmplitude - smoothedAmplitudeRef.current) * releaseSpeed;
      }

      const audioAmplitude = smoothedAmplitudeRef.current;

      // Log every 60 frames
      if (frameCount % 60 === 0) {
        console.log('[Animation] raw:', rawAmplitude.toFixed(4), 'smoothed:', audioAmplitude.toFixed(4),
                    'attack:', attackSpeed.toFixed(3), 'release:', releaseSpeed.toFixed(3));
      }
      frameCount++;

      // PHASE 2: Fast spike wave (travels left to right)
      // Position goes from 0 to 1 across all bars, then wraps
      const spikePosition = (time * spikeSpeed) % 1;

      // PHASE 1: Independent bar oscillation (amplitude-sensitive)
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;

        const char = barCharacteristics.current[i];
        if (!char) return;

        // Calculate bar position (0-1 across all bars)
        const barPosition = i / (NUM_BARS - 1);

        // Independent oscillation - scaled by audio amplitude
        // When silent (amplitude ~0), oscillation is tiny
        // When loud (amplitude ~1), oscillation is more pronounced
        // Speed multiplier makes it more lively (configurable)
        const oscillationAmount = Math.sin(time * char.speed * oscSpeed + char.phaseOffset) * oscAmount;
        const scaledOscillation = oscillationAmount * Math.max(0.05, audioAmplitude);

        // Spike wave - affects only the bar at spikePosition
        // Distance from spike position (0 when spike is at this bar)
        const distance = Math.abs(barPosition - spikePosition);
        // Sharp falloff - only affects current bar (distance < ~0.1)
        const sharpness = NUM_BARS * 2; // Higher = sharper (only 1 bar lit)
        const spikeEffect = Math.max(0, 1 - distance * sharpness) * spikeIntensity * audioAmplitude;

        // Combine: base audio amplitude + scaled oscillation + spike
        // Allow spike to push above 1.0, but cap at 1.5 for safety
        const finalAmplitude = Math.max(0.05, Math.min(1.5,
          audioAmplitude + scaledOscillation + spikeEffect
        ));

        bar.style.setProperty('--amplitude', finalAmplitude.toString());
      });

      localAnimationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      console.log('[Animation] Stopping animation loop');
      if (localAnimationId) {
        cancelAnimationFrame(localAnimationId);
      }
    };
  }, [useRealMic, NUM_BARS]); // Config now read from ref, no restart needed!

  // Choose which amplitude to use
  const currentAmplitude = useRealMic ? realAmplitude : amplitude;

  // Render with GPU transforms when using real mic, otherwise use old logic
  if (useRealMic) {
    const bars = Array.from({ length: NUM_BARS }, (_, i) => i);

    return (
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px',
        border: '2px solid #000',
        borderRadius: '12px',
      }}>
        {/* Mic toggle button - top right */}
        <button
          onClick={() => setUseRealMic(!useRealMic)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '8px',
            background: useRealMic ? '#dc2626' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            zIndex: 10,
          }}
          title={useRealMic ? 'Stop microphone' : 'Use real microphone'}
        >
          🎤
        </button>

        {micError && (
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '10px',
            color: '#dc2626',
            fontSize: '11px',
            maxWidth: '150px',
            textAlign: 'right',
          }}>
            {micError}
          </div>
        )}

        {/* Visualization */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: `${MAX_HEIGHT * 2 + 20}px`,
        }}>
          <div style={{
            display: 'flex',
            gap: `${BAR_GAP}px`,
            alignItems: 'center',
            height: '100%',
          }}>
            {bars.map((index) => (
              <div
                key={index}
                ref={(el) => (barRefs.current[index] = el)}
                style={{
                  width: `${BAR_WIDTH}px`,
                  height: `${MAX_HEIGHT * 2}px`,
                  background: COLOR_MODE === 'gradient'
                    ? `linear-gradient(to bottom, ${COLOR1}, ${COLOR2}, ${COLOR1})`
                    : COLOR1,
                  borderRadius: `${BORDER_RADIUS}px`,
                  boxShadow: GLOW_INTENSITY === 0
                    ? 'none'
                    : `0 0 ${GLOW_INTENSITY}px ${COLOR1}aa`,
                  transform: 'scaleY(var(--amplitude, 0.2))',
                  transformOrigin: 'center',
                  transition: 'transform 0.1s ease-out',
                  ['--amplitude']: '0.2',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Old logic for fake data
  const displayData = Array.from({ length: NUM_BARS }, () => {
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(0.1, Math.min(1.0, currentAmplitude + variation));
  });

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px',
      border: '2px solid #000',
      borderRadius: '12px',
    }}>
      {/* Mic toggle button - top right */}
      <button
        onClick={() => setUseRealMic(!useRealMic)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '8px',
          background: useRealMic ? '#dc2626' : '#444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          zIndex: 10,
        }}
        title={useRealMic ? 'Stop microphone' : 'Use real microphone'}
      >
        🎤
      </button>

      {/* Visualization */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: `${MAX_HEIGHT * 2 + 20}px`,
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          gap: `${BAR_GAP}px`,
          alignItems: 'center',
          height: '100%',
          position: 'relative',
          zIndex: 1,
        }}>
          {displayData.map((barAmplitude, index) => {
            const height = barAmplitude * MAX_HEIGHT;

            return (
              <div
                key={index}
                style={{
                  width: `${BAR_WIDTH}px`,
                  height: `${height * 2}px`,
                  background: COLOR_MODE === 'gradient'
                    ? `linear-gradient(to bottom, ${COLOR1}, ${COLOR2}, ${COLOR1})`
                    : COLOR1,
                  borderRadius: `${BORDER_RADIUS}px`,
                  transition: 'height 0.05s ease-out',
                  boxShadow: GLOW_INTENSITY === 0
                    ? 'none'
                    : `0 0 ${GLOW_INTENSITY + (barAmplitude * GLOW_INTENSITY * 0.5)}px ${COLOR1}${barAmplitude > 0.3 ? 'cc' : '88'}`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ThickBarsVisualization;
