import readline from 'node:readline';

let rlInterface: readline.Interface | null = null;
let isRawMode: boolean = false;

export function setReadlineInterface(interfaceInstance: readline.Interface): void {
  rlInterface = interfaceInstance;
}

export function setRawMode(enabled: boolean): void {
  isRawMode = enabled;
  if (enabled) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  } else {
    process.stdin.setRawMode(false);
  }
}

export async function promptUser(question: string): Promise<string> {
  if (!rlInterface) {
    rlInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  // Temporarily disable raw mode for prompts
  const wasRawMode = isRawMode;
  if (wasRawMode) {
    setRawMode(false);
  }

  return new Promise((resolve) => {
    if (!rlInterface) {
      resolve('');
      return;
    }
    rlInterface.question(question, (answer) => {
      // Restore raw mode after prompt
      if (wasRawMode) {
        setRawMode(true);
      }
      resolve(answer.trim());
    });
  });
}

export function closeReadlineInterface(): void {
  if (rlInterface) {
    rlInterface.close();
    rlInterface = null;
  }
}
