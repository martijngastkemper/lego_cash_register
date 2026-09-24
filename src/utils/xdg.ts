import path from 'node:path';

function xdgDir(variableName: 'XDG_CONFIG_HOME' | 'XDG_CACHE_HOME', appName: string, hint: string): string {
  const base = process.env[variableName];
  if (!base) {
    throw new Error(`${variableName} is not set. Point it at your ${hint} and try again.`);
  }
  return path.join(base, appName);
}

/**
 * App directory inside XDG_CONFIG_HOME. No fallback: throws when the
 * variable is unset instead of guessing a location.
 */
export function xdgConfigDir(appName: string): string {
  return xdgDir('XDG_CONFIG_HOME', appName, 'config directory (e.g. ~/.config)');
}

/**
 * App directory inside XDG_CACHE_HOME. No fallback: throws when the
 * variable is unset instead of guessing a location.
 */
export function xdgCacheDir(appName: string): string {
  return xdgDir('XDG_CACHE_HOME', appName, 'cache directory (e.g. ~/.cache)');
}
