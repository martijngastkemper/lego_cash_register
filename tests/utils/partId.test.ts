import { describe, it, expect } from 'vitest';
import { stripPartIdSuffix } from '../../src/utils/partId';

describe('utils/partId', () => {
  describe('stripPartIdSuffix', () => {
    it('should remove alphanumeric suffix from part ID', () => {
      expect(stripPartIdSuffix('3684a')).toBe('3684');
      expect(stripPartIdSuffix('3684b')).toBe('3684');
      expect(stripPartIdSuffix('3684x1')).toBe('3684');
    });

    it('should return the same part ID if no suffix exists', () => {
      expect(stripPartIdSuffix('3684')).toBe('3684');
      expect(stripPartIdSuffix('12345')).toBe('12345');
    });

    it('should return the input if no numeric prefix exists', () => {
      expect(stripPartIdSuffix('abc')).toBe('abc');
      expect(stripPartIdSuffix('a1b2c3')).toBe('a1b2c3');
    });

    it('should handle empty string', () => {
      expect(stripPartIdSuffix('')).toBe('');
    });
  });
});
