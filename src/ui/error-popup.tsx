/**
 * Error popup component
 * Shows error message at bottom-center for 2 seconds
 */

import React, { useEffect, useState } from 'react';

interface ErrorPopupProps {
  message?: string;
  onDismiss?: () => void;
}

export const ErrorPopup: React.FC<ErrorPopupProps> = ({ message, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      setFadeOut(false);

      // Start fade-out after 1.5 seconds
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 1500);

      // Fully dismiss after 2 seconds
      const dismissTimer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, 2000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setVisible(false);
    }
  }, [message, onDismiss]);

  if (!visible || !message) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#000',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 10001,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none',
        minWidth: '200px',
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  );
};
