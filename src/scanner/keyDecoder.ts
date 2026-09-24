export type ScanKeyAction =
  | { type: 'accumulate'; digit: string }
  | { type: 'backspace' }
  | { type: 'repeat'; count: number }
  | { type: 'undo' }
  | { type: 'scan' }
  | { type: 'quit' }
  | { type: 'ignore' };

export interface KeyDecodeResult {
  action: ScanKeyAction;
  repeatCountInput: string;
}

/**
 * Decode a single raw-mode keypress into an action and the next state of the
 * repeat count buffer. Pure: no I/O, no side effects.
 */
export function decodeScanKey(input: string, repeatCountInput: string): KeyDecodeResult {
  if (input === 'q') {
    return { action: { type: 'quit' }, repeatCountInput };
  }

  // Accumulate digits for the repeat multiplier (e.g. "3r" repeats 3 times)
  if (/^[0-9]$/.test(input)) {
    return {
      action: { type: 'accumulate', digit: input },
      repeatCountInput: repeatCountInput + input,
    };
  }

  // Backspace removes the last buffered digit
  if (input === '\x7f' || input === '\b') {
    if (repeatCountInput.length > 0) {
      return {
        action: { type: 'backspace' },
        repeatCountInput: repeatCountInput.slice(0, -1),
      };
    }
    return { action: { type: 'ignore' }, repeatCountInput };
  }

  if (input === 'r') {
    const count = parseInt(repeatCountInput, 10) || 1;
    return { action: { type: 'repeat', count }, repeatCountInput: '' };
  }

  if (input === 'u') {
    return { action: { type: 'undo' }, repeatCountInput: '' };
  }

  if (input === '\r' || input === '\n') {
    return { action: { type: 'scan' }, repeatCountInput: '' };
  }

  // Any other key resets the repeat count buffer
  return { action: { type: 'ignore' }, repeatCountInput: '' };
}
