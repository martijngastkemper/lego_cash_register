import { describe, it, expect, afterEach } from 'vitest';
import { xdgConfigDir } from '../../src/utils/xdg.js';

describe('utils/xdg', () => {
  const original = process.env.XDG_CONFIG_HOME;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = original;
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
});
