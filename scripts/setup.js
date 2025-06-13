import fs from 'fs/promises';
import { existsSync } from 'fs';
import readline from 'readline';
import { spawn } from 'child_process';

const examplePath = '.env.example';
const envPath = '.env';

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  if (!existsSync(examplePath)) {
    console.error(`${examplePath} not found. Create one with your required env variables.`);
    process.exit(1);
  }

  if (!existsSync(envPath)) {
    console.log(`Creating ${envPath} from ${examplePath}`);
    const content = await fs.readFile(examplePath, 'utf-8');
    const lines = content.split('\n');
    const result = [];

    for (const line of lines) {
      if (!line || line.startsWith('#')) {
        result.push(line);
        continue;
      }
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

  const installer = spawn('npm', ['install'], { stdio: 'inherit' });
  installer.on('close', (code) => {
    if (code === 0) {
      console.log('Dependencies installed successfully.');
    } else {
      console.error(`npm install exited with code ${code}.`);
    }
  });
}

main();