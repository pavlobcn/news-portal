#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const SOURCES_FILE = path.resolve(__dirname, 'RssSources.txt');
const OUTPUT_DIR = path.resolve(__dirname, 'RSS');

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
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
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = await response.text();
      const parsed = new URL(url);
      const host = sanitizeFileName(parsed.hostname || 'source');
      const name = `${String(i + 1).padStart(2, '0')}-${host}.xml`;
      const filePath = path.join(OUTPUT_DIR, name);

      await fs.writeFile(filePath, body, 'utf8');
      console.log(`Saved: ${filePath}`);
    } catch (error) {
      console.error(`Failed: ${url} (${error.message})`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
