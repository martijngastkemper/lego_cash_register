import { RebrickableClient as RebrickableApiClient, type Color, type ListResult } from 'rebrickable-api-client';
import { loadColorCache, refreshColorCache, findColorId } from './colorCache.js';
import { promptUser } from '../utils/prompt.js';
import { loadConfig, saveConfig } from '../utils/config.js';

export class RebrickableWrapper {
  public client: RebrickableApiClient;
  private colors: Color[] = [];
  private partListId: string | null = null;

  constructor(apiKey: string, userToken?: string) {
    this.client = new RebrickableApiClient({ apiKey, userToken });
  }

  async initialize(): Promise<void> {
    const apiKey = this.client.configuration.headers?.Authorization?.split(' ')[1];
    if (!apiKey) throw new Error('API key is required');
    this.colors = await loadColorCache(apiKey);
  }

  async selectPartList(): Promise<void> {
    const config = loadConfig();
    const { results: partLists } = await this.client.listPartLists();

    // If no part lists exist, prompt to create one
    if (partLists.length === 0) {
      const name = await promptUser('No part lists found. Enter name for new part list: ');
      const newList = await this.client.createPartList(name);
      this.partListId = newList.id.toString();
      config.lastPartListId = this.partListId;
      saveConfig(config);
      console.log(`Created new part list: ${newList.name} (ID: ${this.partListId})`);
      return;
    }

    // Default to last used part list (if exists)
    let defaultPartListId = config.lastPartListId;
    if (!defaultPartListId && partLists.length > 0) {
      defaultPartListId = partLists[0].id.toString();
    }

    const defaultPartList = partLists.find((list) => list.id.toString() === defaultPartListId);
    const defaultName = defaultPartList?.name || partLists[0].name;

    const answer = await promptUser(
      `Use part list "${defaultName}" (ID: ${defaultPartListId})? [Y/n/c]: `
    );

    if (answer.toLowerCase() === 'y' || answer === '') {
      this.partListId = defaultPartListId!;
    } else if (answer.toLowerCase() === 'n') {
      // Let user select from existing part lists
      console.log('Available part lists:');
      partLists.forEach((list, index) => {
        console.log(`${index + 1}. ${list.name} (ID: ${list.id})`);
      });

      const selection = await promptUser('Select a part list (number): ');
      const selectedIndex = parseInt(selection, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < partLists.length) {
        this.partListId = partLists[selectedIndex].id.toString();
        config.lastPartListId = this.partListId;
        saveConfig(config);
      } else {
        console.log('Invalid selection. Using default part list.');
        this.partListId = defaultPartListId!;
      }
    } else if (answer.toLowerCase() === 'c') {
      // Create a new part list
      const name = await promptUser('Enter name for new part list: ');
      const newList = await this.client.createPartList(name);
      this.partListId = newList.id.toString();
      config.lastPartListId = this.partListId;
      saveConfig(config);
      console.log(`Created new part list: ${newList.name} (ID: ${this.partListId})`);
    } else {
      console.log('Invalid input. Using default part list.');
      this.partListId = defaultPartListId!;
    }
  }

  async refreshColors(): Promise<Color[]> {
    const apiKey = this.client.configuration.headers?.Authorization?.split(' ')[1];
    if (!apiKey) throw new Error('API key is required');
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
      await this.selectPartList();
    }
    const resolvedPartId = await this.resolvePartId(partId);
    const resolvedColorId = await this.resolveColorId(colorName);
    if (!this.partListId) throw new Error('Part list ID is not set');
    await this.client.addPartListPart(this.partListId, resolvedPartId, resolvedColorId, 1);
  }
}
