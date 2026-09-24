import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { promptUser } from '../utils/prompt.js';
import { printLine, printInline, printError } from '../utils/output.js';
import { loadConfig, saveConfig } from '../utils/config.js';

const execFileAsync = promisify(execFile);

const TEMP_DIR = path.join(os.tmpdir(), 'lego_cash_register');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let selectedDevice: string | null = null;

export async function listDevices(): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('imagesnap', ['-l']);
    const lines = stdout.trim().split('\n');
    
    // Parse imagesnap -l output format:
    // Video Devices:
    // => MacBook Air Camera
    // => iPhone 11 Camera
    const devices: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip header lines like "Video Devices:"
      if (trimmed.endsWith(':') || trimmed === '') {
        continue;
      }
      // Remove "=> " prefix if present
      const deviceName = trimmed.startsWith('=> ') ? trimmed.slice(3) : trimmed;
      if (deviceName) {
        devices.push(deviceName);
      }
    }
    return devices;
  } catch (error: any) {
    printError(`Error listing devices: ${error.message}`);
    return [];
  }
}

export async function selectDevice(): Promise<string | null> {
  const config = loadConfig();
  const devices = await listDevices();
  
  if (devices.length === 0) {
    printError('No camera devices found. Please connect a camera.');
    return null;
  }

  // Check if a last device was previously selected
  const hasLastDevice = config.lastDevice !== undefined;

  if (hasLastDevice) {
    // Check if the last device is still available
    const lastDevice = config.lastDevice!;
    const lastDeviceIndex = devices.findIndex(d => d === lastDevice);
    
    if (lastDeviceIndex !== -1) {
      // Default to last used device
      const answer = await promptUser(
        `Use camera "${lastDevice}" (number, or press Enter)? [Y/n]: `
      );
      
      if (answer.toLowerCase() === 'y' || answer === '') {
        return lastDevice;
      }
    }
  }

  if (devices.length === 1) {
    return devices[0];
  }

  // Multiple devices: let user select
  printLine('Available camera devices:');
  devices.forEach((device: string, index: number) => {
    printLine(`${index + 1}. ${device}`);
  });

  const selection = await promptUser('Select a camera device (number): ');
  const selectedIndex = parseInt(selection, 10) - 1;
  
  if (selectedIndex >= 0 && selectedIndex < devices.length) {
    const selected = devices[selectedIndex];
    // Save the selected device
    config.lastDevice = selected;
    saveConfig(config);
    return selected;
  }
  
  printLine('Invalid selection. Using first device.');
  const firstDevice = devices[0];
  config.lastDevice = firstDevice;
  saveConfig(config);
  return firstDevice;
}

export async function captureImage(): Promise<string> {
  const timestamp = Date.now();
  const imagePath = path.join(TEMP_DIR, `scan_${timestamp}.jpg`);

  const deviceArgs = selectedDevice ? ['-d', selectedDevice] : [];
  printInline('\n📸 Capturing image... ');
  await execFileAsync('imagesnap', [...deviceArgs, imagePath]);
  printInline('Done.');
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
