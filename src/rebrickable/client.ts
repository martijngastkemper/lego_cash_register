import { RebrickableClient as RebrickableApiClient, type Color, type ListResult, type Part, type UserPart, type Paginated } from 'rebrickable-api-client';
import { loadColorCache, refreshColorCache, findColorId } from './colorCache.js';
import { promptUser } from '../utils/prompt.js';
import { loadConfig, saveConfig } from '../utils/config.js';
import { stripPartIdSuffix } from '../utils/partId.js';

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
        console.log(`Using part list: ${defaultName}`);
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
      console.log(`Using part list: ${partLists[selectedIndex - 1].name}`);
    } else {
      console.log('Invalid selection. Using first part list.');
      this.partListId = partLists[0].id.toString();
      config.lastPartListId = this.partListId;
      saveConfig(config);
      console.log(`Using part list: ${partLists[0].name}`);
    }
  }

  async refreshColors(): Promise<Color[]> {
    const apiKey = this.client.configuration.headers?.Authorization?.split(' ')[1];
    if (!apiKey) throw new Error('API key is required');
    this.colors = await refreshColorCache(apiKey);
    return this.colors;
  }

  async searchPartsByPrefix(prefix: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const { results } = await this.client.listParts({ search: prefix, pageSize: 5 });
      return results.slice(0, 5).map((part: Part) => ({ id: part.part_num, name: part.name }));
    } catch (error: any) {
      console.error('Error searching for parts:', error);
      return [];
    }
  }

  async promptForPartSelection(
    parts: Array<{ id: string; name: string }>,
    originalPartId: string
  ): Promise<string | null> {
    console.error(`\nMultiple parts match the prefix "${originalPartId}":`);
    parts.forEach((part, index) => {
      console.error(`${index + 1}. ${part.name} (ID: ${part.id}) - https://rebrickable.com/parts/${part.id}/`);
    });
    const selection = await promptUser(`Select a part (number, or 'skip' to skip): `);
    if (selection.toLowerCase() === 'skip') {
      return null;
    }
    const selectedIndex = parseInt(selection, 10) - 1;
    if (selectedIndex >= 0 && selectedIndex < parts.length) {
      return parts[selectedIndex].id;
    }
    return null;
  }

  async resolvePartId(partId: string, partName?: string, colorName?: string): Promise<string | null> {
    try {
      await this.client.getPart(partId);
      return partId;
    } catch (error: any) {
      // Strip suffix and try again
      const strippedPartId = stripPartIdSuffix(partId);
      if (strippedPartId !== partId) {
        try {
          await this.client.getPart(strippedPartId);
          return strippedPartId;
        } catch (error: any) {
          // If stripped ID also fails, search for parts with the numeric prefix
          const matchingParts = await this.searchPartsByPrefix(strippedPartId);
          if (matchingParts.length > 0) {
            return this.promptForPartSelection(matchingParts, partId);
          }
        }
      }

      // If no matches found, prompt the user
      const name = partName || partId;
      const colorInfo = colorName ? ` (Color: ${colorName})` : '';
      console.error(`\nPart not found in Rebrickable: ${name} (ID: ${partId}${colorInfo})`);
      console.error('This part may have moved during scanning. Try scanning again.');
      console.error('Alternatively, search for the part manually at https://rebrickable.com/parts/ and enter the correct ID.');
      const userInput = await promptUser(`Enter Rebrickable part ID for ${name} (or 'skip' to skip): `);
      if (userInput.toLowerCase() === 'skip') {
        return null;
      }
      return userInput;
    }
  }

  async resolveColorId(colorName: string): Promise<number | null> {
    // Use the color name to find the correct Rebrickable color ID
    const colorId = findColorId(colorName, this.colors);
    if (colorId !== null) return colorId;
    
    // If color not found in cache, prompt the user
    const userInput = await promptUser(`Color "${colorName}" not found. Enter Rebrickable color ID (or 'skip' to skip): `);
    if (userInput.toLowerCase() === 'skip') {
      return null;
    }
    return parseInt(userInput, 10);
  }

  async findPartInList(partId: string, colorId: number): Promise<UserPart | null> {
    try {
      const { results } = await this.client.listPartListParts(this.partListId!);
      return results.find(
        (part: UserPart) => part.part.part_num === partId && part.color.id === colorId
      ) ?? null;
    } catch (error: any) {
      console.error('Error checking part in list:', error);
      return null;
    }
  }

  async addPart(partId: string, colorName: string, partName?: string, quantity: number = 1): Promise<void> {
    if (!this.partListId) {
      throw new Error('Part list not selected. Call selectPartList() first.');
    }

    const resolvedPartId = await this.resolvePartId(partId, partName, colorName);
    if (resolvedPartId === null) {
      return; // Skip this part
    }

    const resolvedColorId = await this.resolveColorId(colorName);
    if (resolvedColorId === null) {
      return; // Skip this part
    }

    try {
      // First try to fetch the existing part from the list
      const existingPart = await this.findPartInList(resolvedPartId, resolvedColorId);
      
      if (existingPart) {
        // Part exists: update quantity with PATCH
        await this.client.updatePartListPart(
          this.partListId,
          resolvedPartId,
          resolvedColorId,
          { quantity: existingPart.quantity + quantity }
        );
      } else {
        // Part doesn't exist: create with POST
        await this.client.addPartListPart(this.partListId, resolvedPartId, resolvedColorId, quantity);
      }
    } catch (error: any) {
      // Improve error message with resolved part/color IDs
      const partDetails = partName ? `${partName} (${partId})` : partId;
      throw new Error(`Failed to add part ${partDetails} (resolved: ${resolvedPartId}, color: ${colorName} -> ${resolvedColorId}) to part list: ${error.message}`);
    }
  }
}
