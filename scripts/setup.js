#!/usr/bin/env node

import fs from 'fs/promises';
import { existsSync } from 'fs';
import readline from 'readline';
import { spawn } from 'child_process';

const examplePath = '.env.example';
const envPath = '.env';

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  if (!existsSync(examplePath)) {
    console.error(`${examplePath} not found. Create one with your required env variables.`);
    process.exit(1);
  }

  if (!existsSync(envPath)) {
    console.log(`Creating ${envPath} from ${examplePath}`);
    let content = await fs.readFile(examplePath, 'utf-8');
    content = content.replace(/\r\n/g, '\n'); // Normalize CRLF

    const result = [];
    for (const rawLine of content.split('\n')) {
      const line = rawLine.replace(/\r$/, '');
      if (!line || line.startsWith('#')) { result.push(line); continue; }
      const [key, defaultVal] = line.split('=', 2);
      const promptText = defaultVal
        ? `Enter value for ${key} (default: ${defaultVal}): `
        : `Enter value for ${key}: `;
      const input = await prompt(promptText);
      result.push(`${key}=${input || defaultVal || ''}`);
    }

    await fs.writeFile(envPath, result.join('\n'), { encoding: 'utf-8', mode: 0o600 });
    console.log(`${envPath} created!`);
  } else {
    console.log(`${envPath} already exists. Skipping creation.`);
  }

  // Install dependencies
  const installer = spawn('npm', ['install'], { stdio: 'inherit', shell: true });
  installer.on('error', (err) => { console.error(`Failed to run npm install: ${err.message}`); process.exit(1); });

  installer.on('close', (code) => {
    if (code !== 0) {
      console.error(`npm install exited with code ${code}.`);
      process.exit(code);
    }
    console.log('Dependencies installed successfully.');

    // Run tests after install
    const tester = spawn('npm', ['test'], { stdio: 'inherit', shell: true });
    tester.on('error', (err) => { console.error(`Failed to run npm test: ${err.message}`); process.exit(1); });
    tester.on('close', (testCode) => {
      if (testCode !== 0) {
        console.error(`npm test exited with code ${testCode}.`);
        process.exit(testCode);
      }
      console.log('All tests passed successfully.');
    });
  });
}

main();
