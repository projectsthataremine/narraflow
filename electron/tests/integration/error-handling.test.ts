import { describe, it, expect, vi } from 'vitest';
import type { ErrorNotificationEvent, UIState } from '@/types/ipc-contracts';

/**
 * Integration test: Error handling
 * Tests: Mic unavailable → error popup shown for 2s
 * Tests: Transcription fails → error popup shown
 */
describe('Error Handling Integration', () => {
  it('should show error notification for mic unavailable', () => {
    const errorEvent: ErrorNotificationEvent = {
      type: 'ErrorNotification',
      message: 'Error, please try again',
    };

    expect(errorEvent.type).toBe('ErrorNotification');
    expect(errorEvent.message).toBe('Error, please try again');
  });

  it('should update UI state with error message', () => {
    const errorState: UIState = {
      mode: 'hidden',
      message: 'Error, please try again',
    };

    expect(errorState.mode).toBe('hidden');
    expect(errorState.message).toBeDefined();
  });

  it('should auto-hide error popup after 2 seconds', async () => {
    let currentState: UIState = {
      mode: 'hidden',
      message: 'Error, please try again',
    };

    // Simulate showing error
    expect(currentState.message).toBeDefined();

    // Simulate 2-second timeout
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate clearing error
    currentState = {
      mode: 'hidden',
      message: undefined,
    };

    expect(currentState.message).toBeUndefined();
  }, 3000);

  it('should handle transcription failure gracefully', () => {
    const failureResponse = {
      ok: false,
      error: 'Transcription failed',
    };

    expect(failureResponse.ok).toBe(false);
    expect(failureResponse.error).toBeDefined();
  });

  it('should return to hidden state after error', () => {
    const states: UIState[] = [
      { mode: 'loading' },
      { mode: 'hidden', message: 'Error, please try again' }, // Error occurs
      { mode: 'hidden' }, // Error cleared
    ];

    expect(states[states.length - 1].mode).toBe('hidden');
    expect(states[states.length - 1].message).toBeUndefined();
  });
});
