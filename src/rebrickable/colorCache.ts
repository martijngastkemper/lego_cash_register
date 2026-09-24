import fs from 'node:fs';
import path from 'node:path';
import { RebrickableClient, type Paginated, type Color } from 'rebrickable-api-client';

const CACHE_DIR = path.join(process.env.HOME || '', '.lego-scan');
const CACHE_FILE = path.join(CACHE_DIR, 'colors.json');

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

  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as Color[];
    colorCache = cached;
    return cached;
  }

  const colors = await fetchAllColors(apiKey);
  colorCache = colors;

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(colors, null, 2));

  return colors;
}

export async function refreshColorCache(apiKey: string): Promise<Color[]> {
  const colors = await fetchAllColors(apiKey);
  colorCache = colors;

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(colors, null, 2));

  return colors;
}

export function findColorId(colorName: string, colors: Color[]): number | null {
  const normalized = colorName.toLowerCase().trim();
  const color = colors.find(
    (c) => c.name.toLowerCase().trim() === normalized
  );
  // Workaround for Rebrickable API bug: Black is sometimes returned as ID 0, but should be 1
  if (color?.id === 0 && normalized === 'black') {
    return 1;
  }
  return color?.id ?? null;
}
