#!/usr/bin/env node

import { Command } from 'commander';
import { RebrickableWrapper } from './rebrickable/client.js';
import { BrickognizeClient } from './brickognize/client.js';
import { startContinuousScanning } from './scanner/continuous.js';

const program = new Command();

program
  .name('lego-scan')
  .description('Scan LEGO parts continuously and add to Rebrickable (macOS only)')
  .option('--rebrickable-key <key>', 'Rebrickable API key (or set REBRICKABLE_API_KEY)')
  .option('--rebrickable-user <user>', 'Rebrickable username (or set REBRICKABLE_USER)')
  .option('--rebrickable-password <password>', 'Rebrickable password (or set REBRICKABLE_PASSWORD)');

program
  .command('scan')
  .description('Start continuous scanning')
  .action(async (options) => {
    const rebrickableKey = options.rebrickableKey || process.env.REBRICKABLE_API_KEY;
    if (!rebrickableKey) {
      console.error('Rebrickable API key is required. Set --rebrickable-key or REBRICKABLE_API_KEY.');
      process.exit(1);
    }

    const user = options.rebrickableUser || process.env.REBRICKABLE_USER;
    const password = options.rebrickablePassword || process.env.REBRICKABLE_PASSWORD;

    const rebrickable = new RebrickableWrapper(rebrickableKey);
    await rebrickable.initialize();

    if (user && password) {
      const { user_token } = await rebrickable.client.getUserToken(user, password);
      rebrickable.client.setUserToken(user_token);
    } else {
      console.error('Rebrickable username and password are required to add parts to your inventory.');
      console.error('Set --rebrickable-user and --rebrickable-password or REBRICKABLE_USER and REBRICKABLE_PASSWORD.');
      process.exit(1);
    }

    // Select part list interactively
    await rebrickable.selectPartList();

    const brickognize = new BrickognizeClient();
    await startContinuousScanning(rebrickable, brickognize);
  });

program
  .command('refresh-colors')
  .description('Refresh the local color cache')
  .action(async (options) => {
    const rebrickableKey = options.rebrickableKey || process.env.REBRICKABLE_API_KEY;
    if (!rebrickableKey) {
      console.error('Rebrickable API key is required. Set --rebrickable-key or REBRICKABLE_API_KEY.');
      process.exit(1);
    }

    const rebrickable = new RebrickableWrapper(rebrickableKey);
    await rebrickable.refreshColors();
    console.log('Color cache refreshed.');
  });

program.parse();
