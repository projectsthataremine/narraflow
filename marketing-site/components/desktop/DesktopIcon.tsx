'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '@/stores/windowStore';

interface DesktopIconProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  initialPosition: { x: number; y: number };
}

export default function DesktopIcon({
  id,
  name,
  icon,
  initialPosition,
}: DesktopIconProps) {
  const { openWindow } = useWindowStore();
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);

  const iconSize = { width: 80, height: 100 };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleDoubleClick = () => {
    // Calculate center of screen with random offset
    const viewportWidth = globalThis.window.innerWidth;
    const viewportHeight = globalThis.window.innerHeight;
    const taskbarHeight = 40;

    // Window size based on window type
    let windowWidth = 600;
    let windowHeight = 400;

    // Custom sizes for specific windows
    if (id === 'pricing') {
      windowHeight = 480;
    } else if (id === 'about') {
      windowWidth = 620;
      windowHeight = 550;
    } else if (id === 'docs') {
      windowWidth = 680;
      windowHeight = 550;
    } else if (id === 'account') {
      windowWidth = 730;
      windowHeight = 620;
    }

    // Center position
    const centerX = (viewportWidth - windowWidth) / 2;
    const centerY = (viewportHeight - windowHeight - taskbarHeight) / 2;

    // Add random offset (-50 to +50 pixels)
    const randomOffsetX = Math.floor(Math.random() * 100) - 50;
    const randomOffsetY = Math.floor(Math.random() * 100) - 50;

    openWindow(id, name, {
      x: centerX + randomOffsetX,
      y: centerY + randomOffsetY
    }, {
      width: windowWidth,
      height: windowHeight
    });
  };

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Boundary checking - keep icon fully on screen
        const maxX = globalThis.window.innerWidth - iconSize.width;
        const maxY = globalThis.window.innerHeight - iconSize.height;

        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, iconSize]);


  return (
    <div
      ref={iconRef}
      className={`absolute flex flex-col items-center gap-2 p-2 cursor-pointer select-none transition-colors ${
        isHovered ? 'bg-[var(--desktop-accent)]/20' : ''
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${iconSize.width}px`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-[var(--desktop-text)] text-4xl">{icon}</div>
      <span className="text-[var(--desktop-text)] text-xs font-mono text-center break-words w-full">
        {name}
      </span>
    </div>
  );
}
