const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const inputFile = path.join(dataDir, 'news.json');

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDayBounds(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function parsePubDate(newsItem) {
  const pubDate = newsItem?.item?.pubDate;
  if (!pubDate) return null;

  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function isInRange(date, range) {
  return date >= range.start && date < range.end;
}

function main() {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`news.json not found: ${inputFile}`);
  }

  const raw = fs.readFileSync(inputFile, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items)) {
    throw new Error('news.json must contain an array of items');
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const todayKey = formatDate(today);
  const yesterdayKey = formatDate(yesterday);

  const todayRange = getDayBounds(today);
  const yesterdayRange = getDayBounds(yesterday);

  const todayItems = [];
  const yesterdayItems = [];

  for (const item of items) {
    const pubDate = parsePubDate(item);
    if (!pubDate) continue;

    if (isInRange(pubDate, todayRange)) {
      todayItems.push(item);
      continue;
    }

    if (isInRange(pubDate, yesterdayRange)) {
      yesterdayItems.push(item);
    }
  }

  const todayFile = path.join(dataDir, `${todayKey}.json`);
  const yesterdayFile = path.join(dataDir, `${yesterdayKey}.json`);

  fs.writeFileSync(todayFile, JSON.stringify(todayItems, null, 2), 'utf8');
  fs.writeFileSync(yesterdayFile, JSON.stringify(yesterdayItems, null, 2), 'utf8');

  console.log(`Wrote ${todayItems.length} items to ${todayFile}`);
  console.log(`Wrote ${yesterdayItems.length} items to ${yesterdayFile}`);
}

main();
