import readline from 'node:readline';

let rlInterface: readline.Interface | null = null;

export function setReadlineInterface(interfaceInstance: readline.Interface): void {
  rlInterface = interfaceInstance;
}

export async function promptUser(question: string): Promise<string> {
  if (!rlInterface) {
    rlInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  return new Promise((resolve) => {
    if (!rlInterface) {
      resolve('');
      return;
    }
    rlInterface.question(question, (answer) => {
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
