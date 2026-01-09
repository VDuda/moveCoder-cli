#!/usr/bin/env node
import { Command } from 'commander';
import { $ } from 'bun';
import { CONFIG } from './config.js';
import { driverManager } from './drivers/index.js';
import { paymentManager } from './x402.js';
import { generateCode, editCode } from './ai.js';
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

import fs from 'fs';
import path from 'path';
import os from 'os';

const SESSION_FILE = path.join(os.homedir(), '.movecoder-session.json');

function saveSession(data: any) {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
    console.log(`Session saved to ${SESSION_FILE}`);
  } catch (error: any) {
    console.error('Failed to save session:', error.message);
  }
}

function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    }
  } catch (error) {
    // ignore
  }
  return null;
}

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
        saveSession(data);
    } catch (err: any) {
        console.error('Login error:', err.message);
    }
  });

program
  .command('generate')
  .description('Generate Move smart contract code from natural language')
  .argument('<prompt>', 'Natural language description of the contract')
  .action(async (prompt) => {
    const session = loadSession();
    if (!session) {
      console.error('Error: You must be logged in to generate code. Please run "movecoder login" first.');
      process.exit(1);
    }
    
    const driver = driverManager.getCurrentDriver();
    console.log(`Generating code using model ${CONFIG.defaultModel} for: "${prompt}"`);
    console.log(`[Context] Active Driver: ${driver.name}`);
    
    // Check/Process Payment via x402
    const paid = await paymentManager.payForGeneration(prompt);
    if (!paid) {
      console.error('Payment failed or was cancelled. Cannot proceed with generation.');
      process.exit(1);
    }

    try {
      console.log('Generation starting...');
      const fullPrompt = `${prompt}\n\n[System Context]: ${driver.documentation.systemPromptExtension}`;
      const code = await generateCode(fullPrompt);
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
  .action(async (instruction, options) => {
    const filePath = options.file;
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File ${filePath} not found.`);
      process.exit(1);
    }

    const session = loadSession();
    if (!session) {
      console.error('Error: You must be logged in to edit code.');
      process.exit(1);
    }

    console.log(`Editing ${filePath} with instruction: "${instruction}"`);
    
    try {
      const currentCode = fs.readFileSync(filePath, 'utf-8');
      const updatedCode = await editCode(instruction, currentCode);
      fs.writeFileSync(filePath, updatedCode);
      console.log(`Successfully updated ${filePath}`);
    } catch (error: any) {
      console.error('Edit failed:', error.message);
    }
  });

program
  .command('build')
  .description('Build the Move project')
  .option('--project <project>', 'Project name or path')
  .action(async (options) => {
    const projectPath = options.project || '.';
    const driver = driverManager.getCurrentDriver();
    console.log(`Building project with ${driver.name} toolchain at: ${projectPath}`);
    
    // Simple command replacement logic
    const cmdParts = driver.toolchain.buildCommand.split(' ');
    const cmd = cmdParts[0];
    const args = [...cmdParts.slice(1), '--package-dir', projectPath];

    try {
      // @ts-ignore - bun shell dynamic execution is flexible
      await $`${cmd} ${args}`;
    } catch (error: any) {
      console.error(`Build failed using driver ${driver.id}.`);
    }
  });

program
  .command('test')
  .description('Run Move tests')
  .option('--unit', 'Run unit tests')
  .action(async (options) => {
    const driver = driverManager.getCurrentDriver();
    console.log(`Running tests with ${driver.name} toolchain...`);
    
    const cmdParts = driver.toolchain.testCommand.split(' ');
    const cmd = cmdParts[0];
    const args = cmdParts.slice(1);

    try {
      await $`${cmd} ${args}`;
    } catch (error: any) {
      console.error('Tests failed.');
    }
  });

program
  .command('deploy')
  .description('Deploy module to network')
  .option('--network <network>', 'Target network (e.g., testnet, devnet)')
  .option('--module <module>', 'Module name to deploy')
  .action(async (options) => {
    const network = options.network || 'devnet';
    const driver = driverManager.getCurrentDriver();
    console.log(`Deploying to ${network} via ${driver.name}...`);
    
    // Replace placeholders
    let cmdStr = driver.toolchain.deployCommand.replace('{network}', network);
    const cmdParts = cmdStr.split(' ');
    const cmd = cmdParts[0];
    const args = cmdParts.slice(1);

    try {
      await $`${cmd} ${args}`;
    } catch (error: any) {
      console.error('Deployment failed.');
    }
  });

program.parse(process.argv);
