import { describe, it, expect } from 'vitest';
import { BrickognizeClient } from '../../src/brickognize/client.js';

describe('brickognize/client', () => {
  describe('BrickognizeClient', () => {
    it('should be a class', () => {
      expect(typeof BrickognizeClient).toBe('function');
    });

    it('should have a predictPart method', () => {
      const client = new BrickognizeClient('test_api_key');
      expect(typeof client.predictPart).toBe('function');
    });
  });
});
