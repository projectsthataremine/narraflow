'use client';

import React, { useState, useEffect } from 'react';
import { useWindowStore } from '@/stores/windowStore';

export default function Taskbar() {
  const { openWindow } = useWindowStore();
  const [time, setTime] = useState('');
  const [battery, setBattery] = useState(100);
  const [networkBars, setNetworkBars] = useState(3);

  // Live clock - 12-hour format with AM/PM
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Battery animation - decreases 1% every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBattery((prev) => {
        if (prev <= 1) return 100; // Reset to 100 when it hits 0
        return prev - 1;
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Network animation - yellow bars every 15s, red bar every 45s
  useEffect(() => {
    // Yellow (2 bars) every 15 seconds for 3 seconds
    const yellowInterval = setInterval(() => {
      setNetworkBars(2);
      setTimeout(() => {
        setNetworkBars(3);
      }, 3000);
    }, 15000);

    // Red (1 bar) every 45 seconds for 3 seconds
    const redInterval = setInterval(() => {
      setNetworkBars(1);
      setTimeout(() => {
        setNetworkBars(3);
      }, 3000);
    }, 45000);

    return () => {
      clearInterval(yellowInterval);
      clearInterval(redInterval);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[var(--desktop-taskbar-bg)] border-t border-[var(--desktop-window-border)] flex items-center justify-between px-4 z-[9999] font-mono text-sm">
      {/* Left: Contact Us button */}
      <button
        className="px-3 py-1 border border-[var(--desktop-text)] text-[var(--desktop-text)] hover:bg-[var(--desktop-accent)]/20 transition-colors"
        onClick={() => {
          const viewportWidth = globalThis.window.innerWidth;
          const viewportHeight = globalThis.window.innerHeight;
          const windowWidth = 600;
          const windowHeight = 400;
          const taskbarHeight = 40;

          const centerX = (viewportWidth - windowWidth) / 2;
          const centerY = (viewportHeight - windowHeight - taskbarHeight) / 2;

          const randomOffsetX = Math.floor(Math.random() * 100) - 50;
          const randomOffsetY = Math.floor(Math.random() * 100) - 50;

          openWindow('contact', 'contact', {
            x: centerX + randomOffsetX,
            y: centerY + randomOffsetY
          });
        }}
      >
        contact us
      </button>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-4 text-[var(--desktop-text)]">
        {/* Battery */}
        <div className="flex items-center gap-2">
          <BatteryIcon percentage={battery} />
          <span style={{ fontSize: '11px' }}>{battery}%</span>
        </div>

        {/* Network */}
        <NetworkIcon bars={networkBars} />

        {/* Language */}
        <span>EN</span>

        {/* Clock */}
        <span>{time}</span>
      </div>
    </div>
  );
}

// Battery Icon Component
function BatteryIcon({ percentage }: { percentage: number }) {
  const fillWidth = Math.max(0, Math.min(100, percentage));

  return (
    <div className="relative w-6 h-3 border border-current flex items-center">
      {/* Battery fill */}
      <div
        className="h-full bg-current transition-all duration-300"
        style={{ width: `${fillWidth}%` }}
      />
      {/* Battery tip */}
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-current" />
    </div>
  );
}

// Network Icon Component
function NetworkIcon({ bars }: { bars: number }) {
  // Color based on signal strength: 3 bars = green, 2 bars = yellow, 1 bar = red
  const getColor = () => {
    if (bars === 3) return '#00ff41'; // Green
    if (bars === 2) return '#ffd866'; // Yellow
    return '#ff6188'; // Red
  };

  const color = getColor();

  return (
    <div className="flex items-end gap-0.5 h-3">
      <div
        className={`w-1 h-1 ${bars >= 1 ? '' : 'opacity-30'}`}
        style={{ backgroundColor: bars >= 1 ? color : 'currentColor' }}
      />
      <div
        className={`w-1 h-2 ${bars >= 2 ? '' : 'opacity-30'}`}
        style={{ backgroundColor: bars >= 2 ? color : 'currentColor' }}
      />
      <div
        className={`w-1 h-3 ${bars >= 3 ? '' : 'opacity-30'}`}
        style={{ backgroundColor: bars >= 3 ? color : 'currentColor' }}
      />
    </div>
  );
}
