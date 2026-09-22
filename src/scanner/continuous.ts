import readline from 'node:readline';
import { captureImage, cleanupTempFiles } from '../camera/capture.js';
import { RebrickableWrapper } from '../rebrickable/client.js';
import { BrickognizeClient } from '../brickognize/client.js';
import { ScannedPart, scanSinglePart } from './scan.js';
import { setReadlineInterface, closeReadlineInterface } from '../utils/prompt.js';

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

  // Set the readline interface for promptUser
  setReadlineInterface(rl);

  console.log('Starting continuous scanning. Press "q" + Enter to stop.');

  process.on('SIGINT', async () => {
    console.log('\nStopping...');
    closeReadlineInterface();
    if (dryRun) {
      await finalizePartsList(partsList);
    }
    cleanupTempFiles();
    process.exit(0);
  });

  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question('Press Enter to scan a part (or "q" to quit): ', resolve);
    });

    if (input.toLowerCase() === 'q') {
      closeReadlineInterface();
      if (dryRun) {
        await finalizePartsList(partsList);
      }
      cleanupTempFiles();
      rl.close();
      break;
    }

    try {
      const imagePath = await captureImage();
      const scannedPart = await scanSinglePart(imagePath, rebrickable, brickognize);

      if (!scannedPart) {
        console.log('Part skipped.');
        continue;
      }

      if (dryRun) {
        partsList.push(scannedPart);
        console.log(`Detected: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
        console.log(`Total parts scanned: ${partsList.length}`);
      } else {
        await rebrickable.addPart(scannedPart.partId, scannedPart.colorName, scannedPart.name);
        console.log(`Added to Rebrickable: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
      }
    } catch (error) {
      console.error('Error scanning part:', error);
    }
  }
}

async function finalizePartsList(partsList: ScannedPart[]): Promise<void> {
  if (partsList.length === 0) {
    console.log('No parts scanned.');
    return;
  }

  console.log('\nDry run. Parts list:');
  partsList.forEach((part) => {
    console.log(`- ${part.name} (ID: ${part.partId}, Color: ${part.colorName})`);
  });
}
