const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const newsFile = path.join(dataDir, 'news.json');

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array in: ${filePath}`);
  }

  return parsed;
}

function getPubDate(item) {
  const value = item?.item?.pubDate;
  return typeof value === 'string' ? value.trim() : '';
}

function toComparableDate(pubDate) {
  const datePart = pubDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return null;
  }

  return datePart;
}

function main() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayDate = yesterday.toISOString().slice(0, 10);

  const newsItems = readJsonArray(newsFile);

  const filteredNewsItems = newsItems.filter((item) => {
    const pubDate = getPubDate(item);
    const comparableDate = toComparableDate(pubDate);

    if (!comparableDate) {
      return true;
    }

    return comparableDate >= yesterdayDate;
  });

  const deletedItems = newsItems.length - filteredNewsItems.length;

  fs.writeFileSync(newsFile, JSON.stringify(filteredNewsItems, null, 2), 'utf8');

  console.log(`Total number of items: ${newsItems.length}`);
  console.log(`Number of deleted items: ${deletedItems}`);
  console.log(`Number of items left in news.json: ${filteredNewsItems.length}`);
}

main();
