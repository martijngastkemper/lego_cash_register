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

  // Set up raw mode for single-key input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.on('SIGINT', async () => {
    console.log('\nStopping...');
    process.stdin.setRawMode(false);
    closeReadlineInterface();
    cleanupTempFiles();
    process.exit(0);
  });

  // Handle keypress events
  process.stdin.on('data', async (key: Buffer) => {
    const input = key.toString();

    if (input === 'q') {
      process.stdin.setRawMode(false);
      closeReadlineInterface();
      cleanupTempFiles();
      rl.close();
      process.exit(0);
    }

    if (input === 'r' && lastScannedPart) {
      try {
        await rebrickable.addPart(lastScannedPart.partId, lastScannedPart.colorName, lastScannedPart.name, true);
        console.log(`Added to Rebrickable: ${lastScannedPart.name} (Part: ${lastScannedPart.partId}, Color: ${lastScannedPart.colorName})`);
      } catch (error) {
        console.error('Error repeating part:', error);
      }
      return;
    }

    if (input === '\r' || input === '\n') {
      try {
        const imagePath = await captureImage();
        const scannedPart = await scanSinglePart(imagePath, rebrickable, brickognize);

        if (!scannedPart) {
          console.log('Part skipped.');
          return;
        }

        lastScannedPart = scannedPart;

        await rebrickable.addPart(scannedPart.partId, scannedPart.colorName, scannedPart.name);
        console.log(`Added to Rebrickable: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
      } catch (error) {
        console.error('Error scanning part:', error);
      }
    }
  });

  // Keep the process alive
  await new Promise(() => {});
}
