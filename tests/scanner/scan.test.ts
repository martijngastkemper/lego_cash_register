import { describe, it, expect } from 'vitest';
import { scanSinglePart } from '../../src/scanner/scan.js';

describe('scanner/scan', () => {
  describe('scanSinglePart', () => {
    it('should be a function', () => {
      expect(typeof scanSinglePart).toBe('function');
    });
  });
});
