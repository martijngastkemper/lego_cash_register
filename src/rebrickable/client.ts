import { RebrickableClient as RebrickableApiClient, type Color, type Part, type ListResult, type UserPart } from 'rebrickable-api-client';
import { loadColorCache, refreshColorCache, findColorId } from './colorCache.js';
import { promptUser } from '../utils/prompt.js';

export class RebrickableWrapper {
  public client: RebrickableApiClient;
  private colors: Color[] = [];
  private partListId: string | null = null;

  constructor(apiKey: string, userToken?: string) {
    this.client = new RebrickableApiClient({ apiKey, userToken });
  }

  async initialize(): Promise<void> {
    const apiKey = this.client.configuration.headers?.Authorization?.split(' ')[1];
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.colors = await loadColorCache(apiKey);
    await this.ensurePartList();
  }

  async ensurePartList(): Promise<void> {
    const { results } = await this.client.listPartLists();
    if (results.length > 0) {
      this.partListId = results[0].id.toString();
    } else {
      const newList = await this.client.createPartList('LEGO Scanner Parts');
      this.partListId = newList.id.toString();
    }
  }

  async refreshColors(): Promise<Color[]> {
    const apiKey = this.client.configuration.headers?.Authorization?.split(' ')[1];
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.colors = await refreshColorCache(apiKey);
    return this.colors;
  }

  async resolvePartId(partId: string): Promise<string> {
    try {
      await this.client.getPart(partId);
      return partId;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return promptUser(`Part ${partId} not found. Enter Rebrickable part ID: `);
      }
      throw error;
    }
  }

  async resolveColorId(colorName: string): Promise<number> {
    const colorId = findColorId(colorName, this.colors);
    if (colorId !== null) return colorId;
    const userInput = await promptUser(`Color "${colorName}" not found. Enter Rebrickable color ID: `);
    return parseInt(userInput, 10);
  }

  async addPart(partId: string, colorName: string): Promise<void> {
    if (!this.partListId) {
      await this.ensurePartList();
    }
    const resolvedPartId = await this.resolvePartId(partId);
    const resolvedColorId = await this.resolveColorId(colorName);
    if (!this.partListId) {
      throw new Error('Part list ID is not set');
    }
    await this.client.addPartListPart(this.partListId, resolvedPartId, resolvedColorId, 1);
  }
}
