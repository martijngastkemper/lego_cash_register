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
): Promise<ScannedPart> {
  const { items, colors } = await brickognize.predictPart(imagePath);
  const { id: partId, name } = items[0];

  let colorName = 'Unknown';
  if (colors && colors.length > 0) {
    colorName = colors[0].name;
  }

  const resolvedPartId = await rebrickable.resolvePartId(partId);
  const resolvedColorId = await rebrickable.resolveColorId(colorName);

  return {
    partId: resolvedPartId,
    name,
    colorId: resolvedColorId,
    colorName,
    timestamp: Date.now(),
  };
}
