import readline from 'node:readline';
import { captureImage, cleanupTempFiles } from '../camera/capture.js';
import { RebrickableWrapper } from '../rebrickable/client.js';
import { BrickognizeClient } from '../brickognize/client.js';
import { ScannedPart, scanSinglePart } from './scan.js';

export async function startContinuousScanning(
  rebrickable: RebrickableWrapper,
  brickognize: BrickognizeClient,
  dryRun: boolean
): Promise<void> {
  const partsList: ScannedPart[] = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Starting continuous scanning. Press "q" + Enter to stop.');

  process.on('SIGINT', async () => {
    console.log('\nStopping...');
    await finalizePartsList(partsList, rebrickable, dryRun);
    cleanupTempFiles();
    process.exit(0);
  });

  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question('Press Enter to scan a part (or "q" to quit): ', resolve);
    });

    if (input.toLowerCase() === 'q') {
      await finalizePartsList(partsList, rebrickable, dryRun);
      cleanupTempFiles();
      rl.close();
      break;
    }

    try {
      const imagePath = await captureImage();
      const scannedPart = await scanSinglePart(imagePath, rebrickable, brickognize);

      partsList.push(scannedPart);
      console.log(`Detected: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
      console.log(`Added to parts list. Total parts scanned: ${partsList.length}`);
    } catch (error) {
      console.error('Error scanning part:', error);
    }
  }
}

async function finalizePartsList(
  partsList: ScannedPart[],
  rebrickable: RebrickableWrapper,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log('\nDry run. Parts list:');
    partsList.forEach((part) => {
      console.log(`- ${part.name} (ID: ${part.partId}, Color: ${part.colorName})`);
    });
    return;
  }

  if (partsList.length === 0) {
    console.log('No parts scanned.');
    return;
  }

  console.log('\nFinalizing parts list...');
  for (const part of partsList) {
    try {
      await rebrickable.addPart(part.partId, part.colorName);
      console.log(`Added to Rebrickable: ${part.name}`);
    } catch (error) {
      console.error(`Failed to add ${part.name} to Rebrickable:`, error);
    }
  }
  console.log('Parts list finalized.');
}
