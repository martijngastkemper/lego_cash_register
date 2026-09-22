#!/usr/bin/env node

import { Command } from 'commander';
import { RebrickableWrapper } from './rebrickable/client.js';
import { BrickognizeClient } from './brickognize/client.js';
import { startContinuousScanning } from './scanner/continuous.js';

const program = new Command();

program
  .name('lego-scan')
  .description('Scan LEGO parts continuously and add to Rebrickable (macOS only)')
  .requiredOption('--rebrickable-key <key>', 'Rebrickable API key')
  .option('--rebrickable-user <user>', 'Rebrickable username')
  .option('--rebrickable-password <password>', 'Rebrickable password')
  .option('--dry-run', 'Scan without adding to Rebrickable');

program
  .command('scan')
  .description('Start continuous scanning')
  .action(async (options) => {
    const rebrickable = new RebrickableWrapper(options.rebrickableKey);
    await rebrickable.initialize();

    if (options.rebrickableUser && options.rebrickablePassword) {
      const { user_token } = await rebrickable.client.getUserToken(
        options.rebrickableUser,
        options.rebrickablePassword
      );
      rebrickable.client.setUserToken(user_token);
    }

    const brickognize = new BrickognizeClient();
    await startContinuousScanning(rebrickable, brickognize, options.dryRun);
  });

program
  .command('refresh-colors')
  .description('Refresh the local color cache')
  .action(async (options) => {
    const rebrickable = new RebrickableWrapper(options.rebrickableKey);
    await rebrickable.refreshColors();
    console.log('Color cache refreshed.');
  });

program.parse();
