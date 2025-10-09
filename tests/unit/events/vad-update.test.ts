import { describe, it, expect } from 'vitest';
import type { VADUpdateEvent } from '@/types/ipc-contracts';
import { validateVADProbability } from '@/types/ipc-contracts';

describe('VADUpdate Event Contract', () => {
  it('should have correct event structure', () => {
    const event: VADUpdateEvent = {
      type: 'VADUpdate',
      probability: 0.75,
    };

    expect(event.type).toBe('VADUpdate');
    expect(event.probability).toBe(0.75);
  });

  it('should validate probability is in [0,1] range', () => {
    expect(validateVADProbability(0.0)).toBe(true);
    expect(validateVADProbability(0.5)).toBe(true);
    expect(validateVADProbability(1.0)).toBe(true);
  });

  it('should reject probability outside [0,1] range', () => {
    expect(validateVADProbability(-0.1)).toBe(false);
    expect(validateVADProbability(1.1)).toBe(false);
    expect(validateVADProbability(2.0)).toBe(false);
  });

  it('should handle edge cases', () => {
    const silenceEvent: VADUpdateEvent = {
      type: 'VADUpdate',
      probability: 0.0,
    };

    const speechEvent: VADUpdateEvent = {
      type: 'VADUpdate',
      probability: 1.0,
    };

    expect(validateVADProbability(silenceEvent.probability)).toBe(true);
    expect(validateVADProbability(speechEvent.probability)).toBe(true);
  });
});
