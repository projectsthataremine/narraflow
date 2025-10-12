'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useWindowStore } from '@/stores/windowStore';

interface WindowProps {
  id: string;
  children: React.ReactNode;
}

export default function Window({ id, children }: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const { windows, closeWindow, bringToFront, updatePosition, updateSize, toggleFullscreen } =
    useWindowStore();

  const windowData = windows.find((w) => w.id === id);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!windowData) return null;

  const { position, size, zIndex, isFullscreen, name } = windowData;

  // Handle drag start
  const handleMouseDownTitle = (e: React.MouseEvent) => {
    // Ignore if clicking on close button
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }

    // Start dragging on single click
    e.preventDefault();
    e.stopPropagation();
    bringToFront(id);

    // Get fresh window position from store
    const currentWindow = windows.find((w) => w.id === id);
    if (!currentWindow) return;

    const dragStartX = e.clientX - currentWindow.position.x;
    const dragStartY = e.clientY - currentWindow.position.y;

    setIsDragging(true);
    setDragStart({
      x: dragStartX,
      y: dragStartY,
    });
  };

  // Handle double-click for fullscreen
  const handleDoubleClickTitle = (e: React.MouseEvent) => {
    // Ignore if clicking on close button
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen(id);
  };

  // Handle resize start
  const handleMouseDownResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(id);
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Mouse move handler (on document)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isFullscreen) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Get fresh window data from store
        const currentWindow = windows.find((w) => w.id === id);
        if (!currentWindow) return;

        // Boundary checking (using global window object)
        const viewportWidth = globalThis.window.innerWidth;
        const viewportHeight = globalThis.window.innerHeight;
        const taskbarHeight = 40; // Height of taskbar (h-10 = 40px)

        const maxX = viewportWidth - currentWindow.size.width;
        const maxY = viewportHeight - currentWindow.size.height - taskbarHeight;

        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));

        updatePosition(id, { x: boundedX, y: boundedY });
      }

      if (isResizing && !isFullscreen) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        // Handle different resize directions
        if (resizeDirection?.includes('e')) {
          newWidth = Math.max(300, size.width + deltaX);
        }
        if (resizeDirection?.includes('s')) {
          newHeight = Math.max(200, size.height + deltaY);
        }
        if (resizeDirection?.includes('w')) {
          newWidth = Math.max(300, size.width - deltaX);
          newX = position.x + deltaX;
        }
        if (resizeDirection?.includes('n')) {
          newHeight = Math.max(200, size.height - deltaY);
          newY = position.y + deltaY;
        }

        // Boundary checking for resize
        const viewportWidth = globalThis.window.innerWidth;
        const viewportHeight = globalThis.window.innerHeight;

        if (newX < 0) {
          newWidth += newX;
          newX = 0;
        }
        if (newY < 0) {
          newHeight += newY;
          newY = 0;
        }
        if (newX + newWidth > viewportWidth) {
          newWidth = viewportWidth - newX;
        }
        if (newY + newHeight > viewportHeight) {
          newHeight = viewportHeight - newY;
        }

        updateSize(id, { width: newWidth, height: newHeight });
        updatePosition(id, { x: newX, y: newY });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, position, size, resizeDirection, id, isFullscreen, updatePosition, updateSize]);

  const windowStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex,
        transform: 'none',
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex,
      };

  return (
    <div
      ref={windowRef}
      className="flex flex-col border border-[var(--desktop-window-border)] bg-[var(--desktop-window-bg)] shadow-2xl"
      style={windowStyle}
      onClick={() => bringToFront(id)}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-[var(--desktop-taskbar-bg)] text-[var(--desktop-text)] cursor-move select-none font-mono text-sm border-b border-[var(--desktop-window-border)]"
        onMouseDown={handleMouseDownTitle}
        onDoubleClick={handleDoubleClickTitle}
      >
        <span>{name}</span>
        <button
          className="hover:text-[var(--desktop-accent)] transition-colors text-xl leading-none"
          onClick={() => closeWindow(id)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          ×
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto desktop-scrollbar">{children}</div>

      {/* Resize Handles (only if not fullscreen) */}
      {!isFullscreen && (
        <>
          {/* Corners */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 'se')}
          />

          {/* Edges */}
          <div
            className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 'n')}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 's')}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 'w')}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize"
            onMouseDown={(e) => handleMouseDownResize(e, 'e')}
          />
        </>
      )}
    </div>
  );
}
