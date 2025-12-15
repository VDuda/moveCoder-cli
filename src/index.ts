#!/usr/bin/env node
import { Command } from 'commander';
import { CONFIG } from './config.js';
import { paymentManager } from './x402.js';
import { generateCode } from './ai.js';

const program = new Command();

program
  .name('movecoder')
  .description('AI-Powered CLI Coding Agent for Movement Network')
  .version(CONFIG.version);

program
  .command('login')
  .description('Authenticate to access protected features')
  .option('--email <email>', 'User email')
  .option('--password <password>', 'User password')
  .action((options) => {
    console.log('Logging in with:', options.email ? options.email : 'interactive mode...');
    // TODO: Implement Better-Auth login
  });

program
  .command('generate')
  .description('Generate Move smart contract code from natural language')
  .argument('<prompt>', 'Natural language description of the contract')
  .action(async (prompt) => {
    console.log(`Generating code using model ${CONFIG.defaultModel} for: "${prompt}"`);
    
    // Check/Process Payment via x402
    const paid = await paymentManager.payForGeneration(prompt);
    if (!paid) {
      console.error('Payment failed or was cancelled. Cannot proceed with generation.');
      process.exit(1);
    }

    try {
      console.log('Generation starting...');
      const code = await generateCode(prompt);
      console.log('\n--- Generated Move Code ---\n');
      console.log(code);
      console.log('\n---------------------------\n');
    } catch (error: any) {
      console.error('Error during generation:', error.message);
      process.exit(1);
    }
  });

program
  .command('edit')
  .description('Edit existing modules with natural language')
  .argument('<instruction>', 'Instruction for the edit')
  .requiredOption('--file <file>', 'Path to the file to edit')
  .action((instruction, options) => {
    console.log(`Editing ${options.file} with instruction: "${instruction}"`);
    // TODO: Implement AI edit logic
  });

program
  .command('build')
  .description('Build the Move project')
  .option('--project <project>', 'Project name or path')
  .action((options) => {
    console.log(`Building project: ${options.project || 'current directory'}`);
    // TODO: specific movement build command
  });

program
  .command('test')
  .description('Run Move tests')
  .option('--unit', 'Run unit tests')
  .action((options) => {
    console.log('Running tests...');
    if (options.unit) console.log('Mode: Unit tests');
    // TODO: specific movement test command
  });

program
  .command('deploy')
  .description('Deploy module to network')
  .option('--network <network>', 'Target network (e.g., testnet, devnet)')
  .option('--module <module>', 'Module name to deploy')
  .action((options) => {
    console.log(`Deploying ${options.module} to ${options.network}...`);
    // TODO: specific movement deploy command
  });

program.parse(process.argv);
