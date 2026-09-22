import { describe, it, expect } from 'vitest';
import { findColorId } from '../../src/rebrickable/colorCache';

describe('rebrickable/colorCache', () => {
  describe('findColorId', () => {
    const mockColors = [
      { id: 1, name: 'White', rgb: '#FFFFFF' },
      { id: 2, name: 'Black', rgb: '#000000' },
    ];

    it('should return color ID for exact name match', () => {
      const colorId = findColorId('White', mockColors);
      expect(colorId).toBe(1);
    });

    it('should return color ID for case-insensitive match', () => {
      const colorId = findColorId('white', mockColors);
      expect(colorId).toBe(1);
    });

    it('should return null if color not found', () => {
      const colorId = findColorId('Red', mockColors);
      expect(colorId).toBeNull();
    });

    it('should trim whitespace from color name', () => {
      const colorId = findColorId('  White  ', mockColors);
      expect(colorId).toBe(1);
    });
  });
});
