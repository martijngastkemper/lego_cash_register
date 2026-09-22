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
  .option('--dry-run', 'Scan without adding to Rebrickable')
  .option('--brickognize-key <key>', 'Brickognize API key (default: BRICKOGNIZE_API_KEY env)');

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

    const brickognizeKey = options.brickognizeKey || process.env.BRICKOGNIZE_API_KEY;
    if (!brickognizeKey) {
      console.error('Brickognize API key is required. Set --brickognize-key or BRICKOGNIZE_API_KEY env.');
      process.exit(1);
    }

    const brickognize = new BrickognizeClient(brickognizeKey);
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
