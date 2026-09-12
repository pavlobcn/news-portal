#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const scripts = [
  'prepare-data.js',
  'generate-summary.js',
];

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n=== Running ${script} ===`);

  const result = spawnSync('node', [scriptPath], {
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Failed to execute ${script}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${script} exited with status code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nAll scripts completed successfully.');
