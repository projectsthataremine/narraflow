/**
 * CSS Variables and Global Styles
 */

export const CSS_VARS = `
:root[data-theme="dark"],
:root {
  --bg-primary: #18191b;
  --bg-secondary: #111113;
  --bg-tertiary: #212225;
  --sidebar-bg: #111113;
  --accent-primary: #0090ff;
  --accent-hover: #3b9eff;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-tertiary: #636366;
  --border-light: #282828;
  --border-medium: #48484a;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.5);
  --font-system: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-system);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}


/* Custom slider styles */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-light);
  height: 4px;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-track {
  background: var(--border-light);
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-md);
}

input[type="range"]::-moz-range-track {
  background: var(--border-light);
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--accent-primary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-md);
}

/* Checkbox accent color */
input[type="checkbox"]:checked {
  accent-color: var(--accent-primary);
}

/* Color picker styles */
input[type="color"] {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="color"]:hover {
  border-color: var(--border-medium);
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

input[type="color"]::-moz-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

/* Custom scrollbar styles - macOS native style */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

/* Light mode scrollbar */
:root[data-theme="light"] ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

:root[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
  background-clip: padding-box;
}

/* Dark mode scrollbar */
:root[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

:root[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
  background-clip: padding-box;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

/* Radix UI Toast styles */
[data-radix-toast-viewport] {
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 10px;
  max-width: 100vw;
  margin: 0;
  list-style: none;
  z-index: 2147483647;
  outline: none;
}

[data-radix-toast-root] {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 15px;
  display: grid;
  grid-template-areas: "title action" "description action";
  grid-template-columns: auto max-content;
  column-gap: 15px;
  align-items: center;
}

[data-radix-toast-root][data-state="open"] {
  animation: slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

[data-radix-toast-root][data-state="closed"] {
  animation: hide 100ms ease-in;
}

@keyframes slideIn {
  from {
    transform: translateX(calc(100% + 24px));
  }
  to {
    transform: translateX(0);
  }
}

@keyframes hide {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
