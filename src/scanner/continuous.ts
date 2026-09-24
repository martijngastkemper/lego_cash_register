import readline from 'node:readline';
import { captureImage, cleanupTempFiles } from '../camera/capture.js';
import { RebrickableWrapper } from '../rebrickable/client.js';
import { BrickognizeClient } from '../brickognize/client.js';
import { ScannedPart, scanSinglePart } from './scan.js';
import { setReadlineInterface, closeReadlineInterface, setRawMode } from '../utils/prompt.js';

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

  // Show initial prompt
  console.log('Starting continuous scanning. Press Enter to scan, "r" to repeat last part, or "q" to quit.');

  // Set up raw mode for single-key input
  setRawMode(true);

  process.on('SIGINT', async () => {
    console.log('\nStopping...');
    setRawMode(false);
    closeReadlineInterface();
    cleanupTempFiles();
    process.exit(0);
  });

  // Function to show the prompt
  function showPrompt(): void {
    process.stdout.write('Press Enter to scan a part (or "r" to repeat, "q" to quit): ');
  }

  // Show initial prompt
  showPrompt();

  // Handle keypress events
  process.stdin.on('data', async (key: Buffer) => {
    const input = key.toString();

    if (input === 'q') {
      setRawMode(false);
      console.log(''); // New line after quit
      closeReadlineInterface();
      cleanupTempFiles();
      rl.close();
      process.exit(0);
    }

    if (input === 'r' && lastScannedPart) {
      try {
        await rebrickable.addPart(lastScannedPart.partId, lastScannedPart.colorName, lastScannedPart.name);
        console.log(`\nAdded to Rebrickable: ${lastScannedPart.name} (Part: ${lastScannedPart.partId}, Color: ${lastScannedPart.colorName})`);
      } catch (error) {
        console.error('\nError repeating part:', error);
      }
      showPrompt();
      return;
    }

    if (input === '\r' || input === '\n') {
      try {
        const imagePath = await captureImage();
        const scannedPart = await scanSinglePart(imagePath, rebrickable, brickognize);

        if (!scannedPart) {
          console.log('\nPart skipped.');
          showPrompt();
          return;
        }

        lastScannedPart = scannedPart;

        await rebrickable.addPart(scannedPart.partId, scannedPart.colorName, scannedPart.name);
        console.log(`\nAdded to Rebrickable: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
      } catch (error) {
        console.error('\nError scanning part:', error);
      }
      showPrompt();
    }
  });

  // Keep the process alive
  await new Promise(() => {});
}
