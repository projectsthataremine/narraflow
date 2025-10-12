import { create } from 'zustand';

export interface WindowState {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isFullscreen: boolean;
  isOpen: boolean;
  previousPosition?: { x: number; y: number };
  previousSize?: { width: number; height: number };
}

interface WindowStore {
  windows: WindowState[];
  activeWindowId: string | null;
  highestZIndex: number;

  // Actions
  openWindow: (id: string, name: string, initialPosition?: { x: number; y: number }, initialSize?: { width: number; height: number }) => void;
  closeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  updatePosition: (id: string, position: { x: number; y: number }) => void;
  updateSize: (id: string, size: { width: number; height: number }) => void;
  toggleFullscreen: (id: string) => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  highestZIndex: 1,

  openWindow: (id, name, initialPosition, initialSize) => {
    const { windows, highestZIndex } = get();
    const existingWindow = windows.find((w) => w.id === id);

    if (existingWindow) {
      // Window already open, just bring it to front
      get().bringToFront(id);
      return;
    }

    const newZIndex = highestZIndex + 1;
    const newWindow: WindowState = {
      id,
      name,
      position: initialPosition || { x: 100, y: 100 },
      size: initialSize || { width: 600, height: 480 },
      zIndex: newZIndex,
      isFullscreen: false,
      isOpen: true,
    };

    set({
      windows: [...windows, newWindow],
      activeWindowId: id,
      highestZIndex: newZIndex,
    });
  },

  closeWindow: (id) => {
    const { windows, activeWindowId } = get();
    const updatedWindows = windows.filter((w) => w.id !== id);

    set({
      windows: updatedWindows,
      activeWindowId: activeWindowId === id ? null : activeWindowId,
    });
  },

  bringToFront: (id) => {
    const { windows, highestZIndex } = get();
    const newZIndex = highestZIndex + 1;

    const updatedWindows = windows.map((w) =>
      w.id === id ? { ...w, zIndex: newZIndex } : w
    );

    set({
      windows: updatedWindows,
      activeWindowId: id,
      highestZIndex: newZIndex,
    });
  },

  updatePosition: (id, position) => {
    const { windows } = get();
    const updatedWindows = windows.map((w) =>
      w.id === id ? { ...w, position } : w
    );

    set({ windows: updatedWindows });
  },

  updateSize: (id, size) => {
    const { windows } = get();
    const updatedWindows = windows.map((w) =>
      w.id === id ? { ...w, size } : w
    );

    set({ windows: updatedWindows });
  },

  toggleFullscreen: (id) => {
    const { windows } = get();
    const updatedWindows = windows.map((w) => {
      if (w.id === id) {
        if (!w.isFullscreen) {
          // Entering fullscreen - save current position and size
          return {
            ...w,
            isFullscreen: true,
            previousPosition: w.position,
            previousSize: w.size,
          };
        } else {
          // Exiting fullscreen - restore previous position and size
          return {
            ...w,
            isFullscreen: false,
            position: w.previousPosition || w.position,
            size: w.previousSize || w.size,
          };
        }
      }
      return w;
    });

    set({ windows: updatedWindows });
  },
}));
