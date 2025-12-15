#!/usr/bin/env node
import { Command } from 'commander';
import { CONFIG } from './config.js';
import { paymentManager } from './x402.js';
import { generateCode } from './ai.js';
import { authClient } from './auth-client.js';

const program = new Command();

program
  .name('movecoder')
  .description('AI-Powered CLI Coding Agent for Movement Network')
  .version(CONFIG.version);

program
  .command('start-server')
  .description('Start the local auth server (required for login)')
  .action(async () => {
    console.log('Starting local auth server...');
    await import('./server.js');
  });

program
  .command('signup')
  .description('Create a new account')
  .requiredOption('--email <email>', 'User email')
  .requiredOption('--password <password>', 'User password')
  .requiredOption('--name <name>', 'User name')
  .action(async (options) => {
      console.log(`Creating account for ${options.email}...`);
      try {
          const { data, error } = await authClient.signUp.email({
              email: options.email,
              password: options.password,
              name: options.name,
          });

          if (error) {
              console.error('Signup failed:', error.message || error.statusText);
              process.exit(1);
          }
          console.log('Signup successful!', data);
      } catch (err: any) {
          console.error('Signup error:', err.message);
      }
  });

program
  .command('login')
  .description('Authenticate to access protected features')
  .option('--email <email>', 'User email')
  .option('--password <password>', 'User password')
  .action(async (options) => {
    const email = options.email;
    const password = options.password;

    if (!email || !password) {
      console.error('Error: Email and password are required for CLI login.');
      process.exit(1);
    }

    console.log(`Logging in as ${email}...`);
    try {
        const { data, error } = await authClient.signIn.email({
            email,
            password,
        });

        if (error) {
            console.error('Login failed:', error.message || error.statusText);
            process.exit(1);
        }

        console.log('Login successful!', data);
        // In a real CLI, we would save the session token/cookie here to a local file
        // e.g. ~/.movecoder/session.json
    } catch (err: any) {
        console.error('Login error:', err.message);
    }
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
