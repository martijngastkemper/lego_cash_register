import fs from 'node:fs';
import path from 'node:path';
import { RebrickableClient, type Color } from 'rebrickable-api-client';

const CACHE_DIR = path.join(process.env.HOME || '', '.lego-scan');
const CACHE_FILE = path.join(CACHE_DIR, 'colors.json');

let colorCache: Color[] | null = null;

export async function loadColorCache(apiKey: string): Promise<Color[]> {
  if (colorCache) return colorCache;

  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as Color[];
    colorCache = cached;
    return cached;
  }

  const client = new RebrickableClient({ apiKey });
  const { results } = await client.listColors();
  colorCache = results as Color[];

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(results, null, 2));

  return results as Color[];
}

export async function refreshColorCache(apiKey: string): Promise<Color[]> {
  const client = new RebrickableClient({ apiKey });
  const { results } = await client.listColors();
  colorCache = results as Color[];

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(results, null, 2));

  return results as Color[];
}

export function findColorId(colorName: string, colors: Color[]): number | null {
  const normalized = colorName.toLowerCase().trim();
  const color = colors.find(
    (c) => c.name.toLowerCase().trim() === normalized
  );
  return color?.id ?? null;
}
