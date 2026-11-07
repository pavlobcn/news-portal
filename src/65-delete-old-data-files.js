#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const retentionDays = 6;
const datedDataFilePattern = /^(\d{4})-(\d{2})-(\d{2})\.(json|md)$/;

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getCutoffDate(now = new Date()) {
  const cutoff = startOfUtcDay(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
  return cutoff;
}

function parseDatePrefix(fileName) {
  const match = datedDataFilePattern.exec(fileName);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function main() {
  if (!fs.existsSync(dataDir)) {
    console.log(`Data directory not found: ${dataDir}`);
    return;
  }

  const cutoffDate = getCutoffDate();
  const deletedFiles = [];

  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;

    const fileDate = parseDatePrefix(entry.name);
    if (!fileDate || fileDate >= cutoffDate) continue;

    const filePath = path.join(dataDir, entry.name);
    fs.unlinkSync(filePath);
    deletedFiles.push(filePath);
  }

  console.log(`Deleted old data files: ${deletedFiles.join(', ') || '(none)'}`);
}

main();
