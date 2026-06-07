const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array in: ${filePath}`);
  }

  return parsed;
}

function getLinkKey(item) {
  const link = item?.link;
  return typeof link === 'string' ? link.trim() : '';
}

function dedupeByLink(items) {
  const seenLinks = new Set();
  const dedupedItems = [];
  let skippedItems = 0;

  for (const item of items) {
    const linkKey = getLinkKey(item);

    if (!linkKey) {
      dedupedItems.push(item);
      continue;
    }

    if (seenLinks.has(linkKey)) {
      skippedItems += 1;
      continue;
    }

    seenLinks.add(linkKey);
    dedupedItems.push(item);
  }

  return { dedupedItems, skippedItems };
}

function processFile(filePath) {
  const items = readJsonArray(filePath);

  if (items === null) {
    console.log(`Skipped missing file: ${filePath}`);
    return;
  }

  const { dedupedItems, skippedItems } = dedupeByLink(items);

  if (skippedItems > 0) {
    fs.writeFileSync(filePath, JSON.stringify(dedupedItems, null, 2), 'utf8');
  }

  console.log(`Loaded ${items.length} items from ${filePath}`);
  console.log(`Deleted ${skippedItems} duplicate items from ${filePath}`);
  console.log(`Saved ${dedupedItems.length} items to ${filePath}`);
}

function main() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const yesterdayFile = path.join(dataDir, `${formatDate(yesterday)}.json`);
  const todayFile = path.join(dataDir, `${formatDate(today)}.json`);

  processFile(yesterdayFile);
  processFile(todayFile);
}

main();
