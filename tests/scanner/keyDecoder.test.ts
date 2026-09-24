import { describe, it, expect } from 'vitest';
import { decodeScanKey } from '../../src/scanner/keyDecoder.js';

describe('scanner/keyDecoder', () => {
  describe('decodeScanKey', () => {
    it('decodes q as quit and keeps the buffer', () => {
      const result = decodeScanKey('q', '12');
      expect(result.action).toEqual({ type: 'quit' });
      expect(result.repeatCountInput).toBe('12');
    });

    it('accumulates a single digit', () => {
      const result = decodeScanKey('3', '');
      expect(result.action).toEqual({ type: 'accumulate', digit: '3' });
      expect(result.repeatCountInput).toBe('3');
    });

    it('accumulates multiple digits', () => {
      const result = decodeScanKey('0', '3');
      expect(result.action).toEqual({ type: 'accumulate', digit: '0' });
      expect(result.repeatCountInput).toBe('30');
    });

    it('decodes r with a buffered count', () => {
      const result = decodeScanKey('r', '3');
      expect(result.action).toEqual({ type: 'repeat', count: 3 });
      expect(result.repeatCountInput).toBe('');
    });

    it('decodes r without a buffer as count 1', () => {
      const result = decodeScanKey('r', '');
      expect(result.action).toEqual({ type: 'repeat', count: 1 });
    });

    it('treats 0r as count 1', () => {
      const result = decodeScanKey('r', '0');
      expect(result.action).toEqual({ type: 'repeat', count: 1 });
    });

    it('decodes u as undo and clears the buffer', () => {
      const result = decodeScanKey('u', '12');
      expect(result.action).toEqual({ type: 'undo' });
      expect(result.repeatCountInput).toBe('');
    });

    it('decodes Enter as scan and clears the buffer', () => {
      const result = decodeScanKey('\r', '12');
      expect(result.action).toEqual({ type: 'scan' });
      expect(result.repeatCountInput).toBe('');

      const resultNewline = decodeScanKey('\n', '12');
      expect(resultNewline.action).toEqual({ type: 'scan' });
      expect(resultNewline.repeatCountInput).toBe('');
    });

    it('resets the buffer on any other key', () => {
      const result = decodeScanKey('x', '12');
      expect(result.action).toEqual({ type: 'ignore' });
      expect(result.repeatCountInput).toBe('');
    });
  });
});
