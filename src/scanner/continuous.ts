import readline from 'node:readline';
import { captureImage, cleanupTempFiles } from '../camera/capture.js';
import { RebrickableWrapper } from '../rebrickable/client.js';
import { BrickognizeClient } from '../brickognize/client.js';
import { ScannedPart, scanSinglePart } from './scan.js';
import { setReadlineInterface, closeReadlineInterface } from '../utils/prompt.js';

export async function startContinuousScanning(
  rebrickable: RebrickableWrapper,
  brickognize: BrickognizeClient
): Promise<void> {
  let lastScannedPart: ScannedPart | null = null;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Set the readline interface for promptUser
  setReadlineInterface(rl);

  console.log('Starting continuous scanning. Press Enter to scan, "r" to repeat last part, or "q" to quit.');

  process.on('SIGINT', async () => {
    console.log('\nStopping...');
    closeReadlineInterface();
    cleanupTempFiles();
    process.exit(0);
  });

  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question('Press Enter to scan a part (or "r" to repeat, "q" to quit): ', resolve);
    });

    if (input.toLowerCase() === 'q') {
      closeReadlineInterface();
      cleanupTempFiles();
      rl.close();
      break;
    }

    if (input.toLowerCase() === 'r' && lastScannedPart) {
      await rebrickable.addPart(lastScannedPart.partId, lastScannedPart.colorName, lastScannedPart.name);
      console.log(`Added to Rebrickable: ${lastScannedPart.name} (Part: ${lastScannedPart.partId}, Color: ${lastScannedPart.colorName})`);
      continue;
    }

    try {
      const imagePath = await captureImage();
      const scannedPart = await scanSinglePart(imagePath, rebrickable, brickognize);

      if (!scannedPart) {
        console.log('Part skipped.');
        continue;
      }

      lastScannedPart = scannedPart;

      await rebrickable.addPart(scannedPart.partId, scannedPart.colorName, scannedPart.name);
      console.log(`Added to Rebrickable: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
    } catch (error) {
      console.error('Error scanning part:', error);
    }
  }
}
