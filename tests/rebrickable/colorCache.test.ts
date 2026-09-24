import { describe, it, expect } from 'vitest';
import { findColorId } from '../../src/rebrickable/colorCache';

describe('rebrickable/colorCache', () => {
  describe('findColorId', () => {
    const mockColors = [
      { id: 0, name: 'Black', rgb: '#000000' },
      { id: 1, name: 'White', rgb: '#FFFFFF' },
      { id: 2, name: 'Red', rgb: '#FF0000' },
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
      const colorId = findColorId('Blue', mockColors);
      expect(colorId).toBeNull();
    });

    it('should trim whitespace from color name', () => {
      const colorId = findColorId('  White  ', mockColors);
      expect(colorId).toBe(1);
    });

     it('should return 0 for Black color', () => {
       const colorId = findColorId('Black', mockColors);
       expect(colorId).toBe(0);
     });

     it('should return 0 for black color (case-insensitive)', () => {
       const colorId = findColorId('black', mockColors);
       expect(colorId).toBe(0);
     });
  });
});
