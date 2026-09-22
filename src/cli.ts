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
  .option('--rebrickable-password <password>', 'Rebrickable password (or set REBRICKABLE_PASSWORD)')
  .option('--dry-run', 'Scan without adding to Rebrickable');

program
  .command('scan')
  .description('Start continuous scanning')
  .action(async (options) => {
    const rebrickableKey = options.rebrickableKey || process.env.REBRICKABLE_API_KEY;
    if (!rebrickableKey) {
      console.error('Rebrickable API key is required. Set --rebrickable-key or REBRICKABLE_API_KEY.');
      process.exit(1);
    }

    const rebrickable = new RebrickableWrapper(rebrickableKey);
    await rebrickable.initialize();

    const user = options.rebrickableUser || process.env.REBRICKABLE_USER;
    const password = options.rebrickablePassword || process.env.REBRICKABLE_PASSWORD;

    if (user && password) {
      const { user_token } = await rebrickable.client.getUserToken(user, password);
      rebrickable.client.setUserToken(user_token);
    }

    // Select part list interactively
    await rebrickable.selectPartList();

    const brickognize = new BrickognizeClient();
    await startContinuousScanning(rebrickable, brickognize, options.dryRun);
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
