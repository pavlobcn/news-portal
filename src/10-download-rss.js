#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const repoRoot = path.resolve(__dirname, '..');
const SOURCES_FILE = path.resolve(repoRoot, 'RssSources.txt');
const OUTPUT_DIR = path.resolve(repoRoot, 'RSS');

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function describeError(error) {
  return error && error.message ? error.message : String(error);
}

async function main() {
  const startedAt = process.hrtime.bigint();
  let successCount = 0;
  let totalBytes = 0;

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
        '300',
        url,
      ], { maxBuffer: 20 * 1024 * 1024 });

      const body = stdout;
      const parsed = new URL(url);
      const host = sanitizeFileName(parsed.hostname || 'source');
      const name = `${String(i + 1).padStart(2, '0')}-${host}.xml`;
      const filePath = path.join(OUTPUT_DIR, name);

      await fs.writeFile(filePath, body, 'utf8');
      successCount += 1;
      totalBytes += Buffer.byteLength(body, 'utf8');
      console.log(`Saved: ${filePath}`);
    } catch (error) {
      console.error(`Failed: ${url} (${describeError(error)})`);
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  const totalKilobytes = totalBytes / 1024;

  console.log(`Successfully downloaded files: ${successCount}`);
  console.log(`Total size: ${totalKilobytes.toFixed(2)} kB`);
  console.log(`Download time: ${(elapsedMs / 1000).toFixed(2)} s`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
