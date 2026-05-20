#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const scripts = [
  '35-join-yesterday-today-news.js',
  '40-split-news-by-day.js',
  '50-generate-news-markdown.js',
  '60-promote-today-news-json.js',
  '70-push-json-md-to-main.js',
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

console.log('\nGenerate-summary scripts completed successfully.');
