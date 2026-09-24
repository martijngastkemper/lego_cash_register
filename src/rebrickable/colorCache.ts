import fs from 'node:fs';
import path from 'node:path';
import { RebrickableClient, type Paginated, type Color } from 'rebrickable-api-client';
import { xdgCacheDir } from '../utils/xdg.js';

function colorCacheFilePath(): string {
  return path.join(xdgCacheDir('lego-scan'), 'colors.json');
}

let colorCache: Color[] | null = null;

async function fetchAllColors(apiKey: string): Promise<Color[]> {
  const client = new RebrickableClient({ apiKey });
  let allColors: Color[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response: Paginated<Color> = await client.listColors({ page, pageSize: 1000 });
    allColors = allColors.concat(response.results);
    hasMore = response.next !== null;
    page++;
  }

  return allColors;
}

export async function loadColorCache(apiKey: string): Promise<Color[]> {
  if (colorCache) return colorCache;

  const cacheFile = colorCacheFilePath();
  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) as Color[];
    colorCache = cached;
    return cached;
  }

  const colors = await fetchAllColors(apiKey);
  colorCache = colors;

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(colors, null, 2));

  return colors;
}

export async function refreshColorCache(apiKey: string): Promise<Color[]> {
  const colors = await fetchAllColors(apiKey);
  colorCache = colors;

  const cacheFile = colorCacheFilePath();
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(colors, null, 2));

  return colors;
}

export function findColorId(colorName: string, colors: Color[]): number | null {
  const normalized = colorName.toLowerCase().trim();
  const color = colors.find(
    (c) => c.name.toLowerCase().trim() === normalized
  );
  return color?.id ?? null;
}
