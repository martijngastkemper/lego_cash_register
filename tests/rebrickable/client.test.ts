import { describe, it, expect } from 'vitest';
import { RebrickableWrapper } from '../../src/rebrickable/client.js';

describe('rebrickable/client', () => {
  describe('RebrickableWrapper', () => {
    it('should be a class', () => {
      expect(typeof RebrickableWrapper).toBe('function');
    });

    it('should have an initialize method', () => {
      const wrapper = new RebrickableWrapper('test_api_key');
      expect(typeof wrapper.initialize).toBe('function');
    });

    it('should have a refreshColors method', () => {
      const wrapper = new RebrickableWrapper('test_api_key');
      expect(typeof wrapper.refreshColors).toBe('function');
    });

    it('should have a resolvePartId method', () => {
      const wrapper = new RebrickableWrapper('test_api_key');
      expect(typeof wrapper.resolvePartId).toBe('function');
    });

    it('should have a resolveColorId method', () => {
      const wrapper = new RebrickableWrapper('test_api_key');
      expect(typeof wrapper.resolveColorId).toBe('function');
    });

    it('should have an addPart method', () => {
      const wrapper = new RebrickableWrapper('test_api_key');
      expect(typeof wrapper.addPart).toBe('function');
    });
  });
});
