import path from 'node:path';

/**
 * App directory inside XDG_CONFIG_HOME. No fallback: throws when the
 * variable is unset instead of guessing a location.
 */
export function xdgConfigDir(appName: string): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (!xdgConfigHome) {
    throw new Error('XDG_CONFIG_HOME is not set. Point it at your config directory (e.g. ~/.config) and try again.');
  }
  return path.join(xdgConfigHome, appName);
}
