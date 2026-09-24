import readline from 'node:readline';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { captureImage, cleanupTempFiles } from '../camera/capture.js';
import { RebrickableWrapper, AddedPart } from '../rebrickable/client.js';
import { BrickognizeClient } from '../brickognize/client.js';
import { ScannedPart, scanSinglePart } from './scan.js';
import { setReadlineInterface, closeReadlineInterface, setRawMode } from '../utils/prompt.js';
import { printLine, printInline, printError } from '../utils/output.js';

const execAsync = promisify(exec);

function playBeep(): void {
  // Try macOS osascript beep first, fall back to ASCII bell
  execAsync('osascript -e \'beep\'').catch(() => {
    printInline('\x07');
  });
}

export async function startContinuousScanning(
  rebrickable: RebrickableWrapper,
  brickognize: BrickognizeClient
): Promise<void> {
  let lastScannedPart: ScannedPart | null = null;
  // Stack of completed adds, most recent last, for undo
  const undoStack: AddedPart[] = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Set the readline interface for promptUser
  setReadlineInterface(rl);

  // Set up raw mode for single-key input
  setRawMode(true);

  process.on('SIGINT', async () => {
    printLine('\nStopping...');
    setRawMode(false);
    closeReadlineInterface();
    cleanupTempFiles();
    process.exit(0);
  });

  // Function to show the prompt
  function showPrompt(): void {
    printInline('Press Enter to scan a part (or "r" to repeat, "<n>r" for multiple, "u" to undo, "q" to quit): ');
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
      printLine(''); // New line after quit
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

      if (!lastScannedPart) {
        return; // Nothing to repeat; the prompt is still on screen
      }

      try {
        const added = await rebrickable.addPart(lastScannedPart.partId, lastScannedPart.colorName, lastScannedPart.name, count);
        if (added) undoStack.push(added);
        printLine(`\n🔁 Added to Rebrickable again${count > 1 ? ` (x${count})` : ''}`);
        playBeep();
      } catch (error) {
        printError(`\n❌ Error repeating part: ${error}`);
      }
      showPrompt();
      return;
    }

    // Any other key resets the repeat count buffer
    repeatCountInput = '';

    if (input === 'u') {
      const lastAdd = undoStack.pop();

      if (!lastAdd) {
        printLine('\n⚠️ Nothing to undo.');
        showPrompt();
        return;
      }

      try {
        const undone = await rebrickable.undoAdd(lastAdd);
        if (undone) {
          printLine(`\n↩️ Undid: ${lastAdd.name} (Part: ${lastAdd.partId}, Color: ${lastAdd.colorName})${lastAdd.quantity > 1 ? ` (x${lastAdd.quantity})` : ''}`);
        } else {
          printError(`\n⚠️ Could not undo: ${lastAdd.name} (Part: ${lastAdd.partId}) is no longer in the part list.`);
        }
      } catch (error) {
        // Restore the stack entry so the undo can be retried
        undoStack.push(lastAdd);
        printError(`\n❌ Error undoing: ${error}`);
      }
      showPrompt();
      return;
    }

    if (input === '\r' || input === '\n') {
      try {
        const imagePath = await captureImage();
        const scannedPart = await scanSinglePart(imagePath, rebrickable, brickognize);

        if (!scannedPart) {
          printLine('\n⚠️ Part skipped.');
          showPrompt();
          return;
        }

        lastScannedPart = scannedPart;

        const added = await rebrickable.addPart(scannedPart.partId, scannedPart.colorName, scannedPart.name);
        if (added) undoStack.push(added);
        printLine(`\n✅ Added to Rebrickable: ${scannedPart.name} (Part: ${scannedPart.partId}, Color: ${scannedPart.colorName})`);
        playBeep();
      } catch (error) {
        printError(`\n❌ Error scanning part: ${error}`);
      }
      showPrompt();
    }
  });

  // Keep the process alive
  await new Promise(() => {});
}
