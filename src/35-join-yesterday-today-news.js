const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const outputFile = path.join(dataDir, 'news.json');

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array in: ${filePath}`);
  }

  return parsed;
}

function getPubDateValue(item) {
  const pubDate = item?.item?.pubDate;
  return typeof pubDate === 'string' ? pubDate.trim() : '';
}

function compareByPubDateDesc(a, b) {
  const dateA = getPubDateValue(a);
  const dateB = getPubDateValue(b);

  if (dateA && dateB) {
    return dateB.localeCompare(dateA);
  }

  if (dateA) return -1;
  if (dateB) return 1;
  return 0;
}

function main() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const todayFile = path.join(dataDir, `${formatDate(today)}.json`);
  const yesterdayFile = path.join(dataDir, `${formatDate(yesterday)}.json`);

  const todayItems = readJsonArray(todayFile);
  const yesterdayItems = readJsonArray(yesterdayFile);
  const existingNewsItems = readJsonArray(outputFile);

  const mergedItems = [...todayItems, ...yesterdayItems, ...existingNewsItems].sort(compareByPubDateDesc);

  fs.writeFileSync(outputFile, JSON.stringify(mergedItems, null, 2), 'utf8');

  console.log(`Loaded ${todayItems.length} items from ${todayFile}`);
  console.log(`Loaded ${yesterdayItems.length} items from ${yesterdayFile}`);
  console.log(`Loaded ${existingNewsItems.length} items from ${outputFile}`);
  console.log(`Saved ${mergedItems.length} items to ${outputFile}`);
  console.log(`Total items in news.json after adding: ${mergedItems.length}`);
}

main();
