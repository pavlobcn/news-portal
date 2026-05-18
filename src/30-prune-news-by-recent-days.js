const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const newsFile = path.join(dataDir, 'news.json');

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function readJsonArray(filePath, required = true) {
  if (!fs.existsSync(filePath)) {
    if (required) {
      throw new Error(`File not found: ${filePath}`);
    }

    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array in: ${filePath}`);
  }

  return parsed;
}

function getLink(item) {
  const link = item?.item?.link;
  return typeof link === 'string' ? link.trim() : '';
}

function main() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const todayFile = path.join(dataDir, `${formatDate(today)}.json`);
  const yesterdayFile = path.join(dataDir, `${formatDate(yesterday)}.json`);

  const newsItems = readJsonArray(newsFile, true);
  const todayItems = readJsonArray(todayFile, false);
  const yesterdayItems = readJsonArray(yesterdayFile, false);

  const linksToRemove = new Set(
    [...todayItems, ...yesterdayItems].map(getLink).filter(Boolean),
  );

  const filteredNewsItems = newsItems.filter((item) => !linksToRemove.has(getLink(item)));
  const removedItemsCount = newsItems.length - filteredNewsItems.length;

  fs.writeFileSync(newsFile, JSON.stringify(filteredNewsItems, null, 2), 'utf8');

  console.log(`Loaded ${newsItems.length} items from ${newsFile}`);
  console.log(`Found ${linksToRemove.size} links to remove from today's and yesterday's files`);
  console.log(`Number of items to remove: ${removedItemsCount}`);
  console.log(`Number of items left in the file: ${filteredNewsItems.length}`);
  console.log(`Saved ${filteredNewsItems.length} items to ${newsFile}`);
}

main();
