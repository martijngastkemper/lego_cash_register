import { describe, it, expect, afterEach } from 'vitest';
import { xdgConfigDir, xdgCacheDir } from '../../src/utils/xdg.js';

describe('utils/xdg', () => {
  const originalConfig = process.env.XDG_CONFIG_HOME;
  const originalCache = process.env.XDG_CACHE_HOME;

  afterEach(() => {
    if (originalConfig === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = originalConfig;
    }
    if (originalCache === undefined) {
      delete process.env.XDG_CACHE_HOME;
    } else {
      process.env.XDG_CACHE_HOME = originalCache;
    }
  });

  it('returns the app directory inside XDG_CONFIG_HOME', () => {
    process.env.XDG_CONFIG_HOME = '/home/test/.config';
    expect(xdgConfigDir('lego-scan')).toBe('/home/test/.config/lego-scan');
  });

  it('throws when XDG_CONFIG_HOME is not set; there is no fallback', () => {
    delete process.env.XDG_CONFIG_HOME;
    expect(() => xdgConfigDir('lego-scan')).toThrow('XDG_CONFIG_HOME is not set');
  });

  it('returns the app directory inside XDG_CACHE_HOME', () => {
    process.env.XDG_CACHE_HOME = '/home/test/.cache';
    expect(xdgCacheDir('lego-scan')).toBe('/home/test/.cache/lego-scan');
  });

  it('throws when XDG_CACHE_HOME is not set; there is no fallback', () => {
    delete process.env.XDG_CACHE_HOME;
    expect(() => xdgCacheDir('lego-scan')).toThrow('XDG_CACHE_HOME is not set');
  });
});
