#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const SOURCES_FILE = path.resolve(__dirname, 'RssSources.txt');
const OUTPUT_DIR = path.resolve(__dirname, 'RSS');

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function describeError(error) {
  return error && error.message ? error.message : String(error);
}

async function main() {
  const content = await fs.readFile(SOURCES_FILE, 'utf8');
  const urls = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (urls.length === 0) {
    console.log('No sources found in RssSources.txt');
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];

    try {
      const { stdout } = await execFileAsync('curl', [
        '--fail',
        '--silent',
        '--show-error',
        '--location',
        '--max-time',
        '60',
        url,
      ], { maxBuffer: 20 * 1024 * 1024 });

      const body = stdout;
      const parsed = new URL(url);
      const host = sanitizeFileName(parsed.hostname || 'source');
      const name = `${String(i + 1).padStart(2, '0')}-${host}.xml`;
      const filePath = path.join(OUTPUT_DIR, name);

      await fs.writeFile(filePath, body, 'utf8');
      console.log(`Saved: ${filePath}`);
    } catch (error) {
      console.error(`Failed: ${url} (${describeError(error)})`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
