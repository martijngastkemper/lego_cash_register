import { describe, it, expect } from 'vitest';
import { captureImage, cleanupTempFiles } from '../../src/camera/capture.js';

describe('camera/capture', () => {
  describe('captureImage', () => {
    it('should be a function', () => {
      expect(typeof captureImage).toBe('function');
    });
  });

  describe('cleanupTempFiles', () => {
    it('should be a function', () => {
      expect(typeof cleanupTempFiles).toBe('function');
    });
  });
});
