import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execAsync = promisify(exec);

const TEMP_DIR = path.join(__dirname, '../../../temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function captureImage(): Promise<string> {
  const timestamp = Date.now();
  const imagePath = path.join(TEMP_DIR, `scan_${timestamp}.jpg`);

  await execAsync(`imagesnap -w 1 ${imagePath}`);
  return imagePath;
}

export function cleanupTempFiles(): void {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}
