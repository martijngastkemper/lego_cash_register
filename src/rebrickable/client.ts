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

    // Check if a last part list was previously selected
    const hasLastPartList = config.lastPartListId !== undefined;

    if (hasLastPartList) {
      // Default to last used part list
      let defaultPartListId = config.lastPartListId!;
      const defaultPartList = partLists.find((list) => list.id.toString() === defaultPartListId);
      const defaultName = defaultPartList?.name || partLists[0].name;

      const answer = await promptUser(
        `Use part list "${defaultName}" (ID: ${defaultPartListId})? [Y/n]: `
      );

      if (answer.toLowerCase() === 'y' || answer === '') {
        this.partListId = defaultPartListId;
        return;
      }
    }

    // Show list of part lists with option to create a new one
    console.log('Available part lists:');
    console.log('0. Create a new part list');
    partLists.forEach((list, index) => {
      console.log(`${index + 1}. ${list.name} (ID: ${list.id})`);
    });

    const selection = await promptUser('Select a part list (number): ');
    const selectedIndex = parseInt(selection, 10);

    if (selectedIndex === 0) {
      // Create a new part list
      const name = await promptUser('Enter name for new part list: ');
      const newList = await this.client.createPartList(name);
      this.partListId = newList.id.toString();
      config.lastPartListId = this.partListId;
      saveConfig(config);
      console.log(`Created new part list: ${newList.name} (ID: ${this.partListId})`);
    } else if (selectedIndex > 0 && selectedIndex <= partLists.length) {
      // Select existing part list
      this.partListId = partLists[selectedIndex - 1].id.toString();
      config.lastPartListId = this.partListId;
      saveConfig(config);
    } else {
      console.log('Invalid selection. Using first part list.');
      this.partListId = partLists[0].id.toString();
      config.lastPartListId = this.partListId;
      saveConfig(config);
    }
  }

  async refreshColors(): Promise<Color[]> {
    const apiKey = this.client.configuration.headers?.Authorization?.split(' ')[1];
    if (!apiKey) throw new Error('API key is required');
    this.colors = await refreshColorCache(apiKey);
    return this.colors;
  }

  async resolvePartId(partId: string, partName?: string): Promise<string | null> {
    try {
      await this.client.getPart(partId);
      return partId;
    } catch (error: any) {
      // Always prompt the user if the part is not found
      const name = partName || partId;
      console.error(`\nPart not found in Rebrickable: ${name} (ID: ${partId})`);
      console.error('This part may have moved during scanning. Try scanning again.');
      console.error('Alternatively, search for the part manually at https://rebrickable.com/parts/ and enter the correct ID.');
      const userInput = await promptUser(`Enter Rebrickable part ID for ${name} (or 'skip' to skip): `);
      if (userInput.toLowerCase() === 'skip') {
        return null; // Signal to skip this part
      }
      return userInput;
    }
  }

  async resolveColorId(colorName: string): Promise<number | null> {
    const colorId = findColorId(colorName, this.colors);
    if (colorId !== null) return colorId;
    const userInput = await promptUser(`Color "${colorName}" not found. Enter Rebrickable color ID (or 'skip' to skip): `);
    if (userInput.toLowerCase() === 'skip') {
      return null;
    }
    return parseInt(userInput, 10);
  }

  async addPart(partId: string, colorName: string, partName?: string): Promise<void> {
    if (!this.partListId) {
      throw new Error('Part list not selected. Call selectPartList() first.');
    }

    const resolvedPartId = await this.resolvePartId(partId, partName);
    if (resolvedPartId === null) {
      return; // Skip this part
    }

    const resolvedColorId = await this.resolveColorId(colorName);
    if (resolvedColorId === null) {
      return; // Skip this part
    }

    await this.client.addPartListPart(this.partListId, resolvedPartId, resolvedColorId, 1);
  }
}
