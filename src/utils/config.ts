import fs from 'node:fs';
import path from 'node:path';
import { xdgConfigDir } from './xdg.js';

function configFilePath(): string {
  return path.join(xdgConfigDir('lego-scan'), 'config.json');
}

interface Config {
  lastPartListId?: string;
  lastDevice?: string;
}

let configCache: Config | null = null;

export function loadConfig(): Config {
  if (configCache) return configCache;

  const configFile = configFilePath();
  if (!fs.existsSync(configFile)) {
    return {};
  }

  try {
    const data = fs.readFileSync(configFile, 'utf-8');
    configCache = JSON.parse(data) as Config;
    return configCache;
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  configCache = config;
  const configFile = configFilePath();
  fs.mkdirSync(path.dirname(configFile), { recursive: true });
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}
