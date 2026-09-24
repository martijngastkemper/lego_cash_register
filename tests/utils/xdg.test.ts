import { describe, it, expect, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { xdgConfigDir, xdgCacheDir } from '../../src/utils/xdg.js';

describe('utils/xdg', () => {
  const originalConfig = process.env.XDG_CONFIG_HOME;
  const originalCache = process.env.XDG_CACHE_HOME;
  const home = os.homedir();

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

  it('uses XDG_CONFIG_HOME when set', () => {
    process.env.XDG_CONFIG_HOME = '/custom/config';
    expect(xdgConfigDir('lego-scan')).toBe('/custom/config/lego-scan');
  });

  it('falls back to ~/.config when XDG_CONFIG_HOME is unset or empty', () => {
    delete process.env.XDG_CONFIG_HOME;
    expect(xdgConfigDir('lego-scan')).toBe(path.join(home, '.config', 'lego-scan'));

    process.env.XDG_CONFIG_HOME = '';
    expect(xdgConfigDir('lego-scan')).toBe(path.join(home, '.config', 'lego-scan'));
  });

  it('uses XDG_CACHE_HOME when set', () => {
    process.env.XDG_CACHE_HOME = '/custom/cache';
    expect(xdgCacheDir('lego-scan')).toBe('/custom/cache/lego-scan');
  });

  it('falls back to ~/.cache when XDG_CACHE_HOME is unset or empty', () => {
    delete process.env.XDG_CACHE_HOME;
    expect(xdgCacheDir('lego-scan')).toBe(path.join(home, '.cache', 'lego-scan'));

    process.env.XDG_CACHE_HOME = '';
    expect(xdgCacheDir('lego-scan')).toBe(path.join(home, '.cache', 'lego-scan'));
  });
});
