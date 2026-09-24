import readline from 'node:readline';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { captureImage, cleanupTempFiles } from '../camera/capture.js';
import { RebrickableWrapper } from '../rebrickable/client.js';
import { BrickognizeClient } from '../brickognize/client.js';
import { ScannedPart, scanSinglePart } from './scan.js';
import { setReadlineInterface, closeReadlineInterface, setRawMode } from '../utils/prompt.js';

const execAsync = promisify(exec);

function playBeep(): void {
  // Try macOS osascript beep first, fall back to ASCII bell
  execAsync('osascript -e \'beep\'').catch(() => {
    process.stdout.write('\x07');
  });
}

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
    process.stdout.write('Press Enter to scan a part (or "r" to repeat, "<n>r" for multiple, "q" to quit): ');
  }

  // Show initial prompt
  showPrompt();

  // Buffer for repeat count input (e.g. "3" before "r" means repeat 3 times)
  let repeatCountInput = '';

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

    // Accumulate digits for the repeat multiplier (e.g. "3r" repeats 3 times)
    if (/^[0-9]$/.test(input)) {
      repeatCountInput += input;
      return;
    }

    if (input === 'r') {
      const count = parseInt(repeatCountInput, 10) || 1;
      repeatCountInput = '';

      if (lastScannedPart) {
        try {
          await rebrickable.addPart(lastScannedPart.partId, lastScannedPart.colorName, lastScannedPart.name, count);
          console.log(`\n🔁 Added to Rebrickable again${count > 1 ? ` (x${count})` : ''}`);
          playBeep();
        } catch (error) {
          console.error('\n❌ Error repeating part:', error);
        }
      }
      showPrompt();
      return;
    }

    // Any other key resets the repeat count buffer
    repeatCountInput = '';

    if (input === '\r' || input === '\n') {
      try {
        const imagePath = await captureImage();
        const scannedPart = await scanSinglePart(imagePath, rebrickable, brickognize);

        if (!scannedPart) {
          console.log('\n⚠️ Part skipped.');
          showPrompt();
          return;
        }

        lastScannedPart = scannedPart;

        await rebrickable.addPart(scannedPart.partId, scannedPart.colorName, scannedPart.name);
        console.log(`\n✅ Added to Rebrickable: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
        playBeep();
      } catch (error) {
        console.error('\n❌ Error scanning part:', error);
      }
      showPrompt();
    }
  });

  // Keep the process alive
  await new Promise(() => {});
}
