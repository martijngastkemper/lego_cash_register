import { describe, it, expect } from 'vitest';
import { promptUser } from '../../src/utils/prompt.js';

describe('utils/prompt', () => {
  describe('promptUser', () => {
    it('should be a function', () => {
      expect(typeof promptUser).toBe('function');
    });
  });
});
