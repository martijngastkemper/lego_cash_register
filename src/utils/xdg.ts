import os from 'node:os';
import path from 'node:path';

/**
 * Resolve an XDG base directory: the environment variable when set (even
 * if empty), otherwise the spec's default.
 */
function xdgDir(variableName: 'XDG_CONFIG_HOME' | 'XDG_CACHE_HOME', defaultDir: string, appName: string): string {
  const base = process.env[variableName] || defaultDir;
  return path.join(base, appName);
}

/** App directory inside XDG_CONFIG_HOME (default ~/.config). */
export function xdgConfigDir(appName: string): string {
  return xdgDir('XDG_CONFIG_HOME', path.join(os.homedir(), '.config'), appName);
}

/** App directory inside XDG_CACHE_HOME (default ~/.cache). */
export function xdgCacheDir(appName: string): string {
  return xdgDir('XDG_CACHE_HOME', path.join(os.homedir(), '.cache'), appName);
}
