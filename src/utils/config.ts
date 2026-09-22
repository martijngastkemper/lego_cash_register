import fs from 'node:fs';
import path from 'node:path';

const CONFIG_DIR = path.join(process.env.HOME || '', '.lego-scan');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  lastPartListId?: string;
}

let configCache: Config | null = null;

export function loadConfig(): Config {
  if (configCache) return configCache;

  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    configCache = JSON.parse(data) as Config;
    return configCache;
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  configCache = config;
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
