import { describe, it, expect } from 'vitest';
import { loadConfig, saveConfig } from '../../src/utils/config.js';

describe('utils/config', () => {
  describe('loadConfig', () => {
    it('should be a function', () => {
      expect(typeof loadConfig).toBe('function');
    });
  });

  describe('saveConfig', () => {
    it('should be a function', () => {
      expect(typeof saveConfig).toBe('function');
    });
  });
});
