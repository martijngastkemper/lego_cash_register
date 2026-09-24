/** Write a message to stdout followed by a newline. */
export function printLine(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** Write a message to stdout without a trailing newline (prompts, inline status). */
export function printInline(message: string): void {
  process.stdout.write(message);
}

/** Write an error message to stderr followed by a newline. */
export function printError(message: string): void {
  process.stderr.write(`${message}\n`);
}
