import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promptUser } from '../utils/prompt.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '../../../temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let selectedDevice: string | null = null;

export async function listDevices(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('imagesnap -l');
    const devices = stdout.trim().split('\n').filter((line: string) => line.trim() !== '');
    return devices;
  } catch (error: any) {
    console.error('Error listing devices:', error.message);
    return [];
  }
}

export async function selectDevice(): Promise<string | null> {
  const devices = await listDevices();
  
  if (devices.length === 0) {
    console.error('No camera devices found. Please connect a camera.');
    return null;
  }

  if (devices.length === 1) {
    return devices[0];
  }

  // Multiple devices: let user select
  console.log('Available camera devices:');
  devices.forEach((device: string, index: number) => {
    console.log(`${index + 1}. ${device}`);
  });

  const selection = await promptUser('Select a camera device (number): ');
  const selectedIndex = parseInt(selection, 10) - 1;
  
  if (selectedIndex >= 0 && selectedIndex < devices.length) {
    return devices[selectedIndex];
  }
  
  console.log('Invalid selection. Using first device.');
  return devices[0];
}

export async function captureImage(): Promise<string> {
  const timestamp = Date.now();
  const imagePath = path.join(TEMP_DIR, `scan_${timestamp}.jpg`);

  const deviceOption = selectedDevice ? `-d "${selectedDevice}"` : '';
  await execAsync(`imagesnap -w 1 ${deviceOption} ${imagePath}`);
  return imagePath;
}

export function setSelectedDevice(device: string): void {
  selectedDevice = device;
}

export function cleanupTempFiles(): void {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}
