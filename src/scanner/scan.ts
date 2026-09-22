import { RebrickableWrapper } from '../rebrickable/client.js';
import { BrickognizeClient } from '../brickognize/client.js';

export interface ScannedPart {
  partId: string;
  name: string;
  colorId: number;
  colorName: string;
  timestamp: number;
}

export async function scanSinglePart(
  imagePath: string,
  rebrickable: RebrickableWrapper,
  brickognize: BrickognizeClient
): Promise<ScannedPart | null> {
  const { items, colors } = await brickognize.predictPart(imagePath);

  if (!items || items.length === 0) {
    console.error('No parts detected in the image. Try again with a clearer image.');
    return null;
  }

  const { id: partId, name } = items[0];

  let colorName = 'Unknown';
  if (colors && colors.length > 0) {
    colorName = colors[0].name;
  }

  const resolvedPartId = await rebrickable.resolvePartId(partId, name);
  if (resolvedPartId === null) {
    return null; // Skip this part
  }

  const resolvedColorId = await rebrickable.resolveColorId(colorName);
  if (resolvedColorId === null) {
    return null; // Skip this part
  }

  return {
    partId: resolvedPartId,
    name,
    colorId: resolvedColorId,
    colorName,
    timestamp: Date.now(),
  };
}
