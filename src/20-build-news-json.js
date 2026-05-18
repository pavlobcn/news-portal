const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const rssDir = path.join(repoRoot, 'RSS');
const outputDir = path.join(repoRoot, 'data');
const outputFile = path.join(outputDir, 'news.json');

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function getTagValue(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return decodeXml(match ? match[1] : '');
}

function formatParts(parts) {
  return {
    year: parts.find((p) => p.type === 'year')?.value,
    month: parts.find((p) => p.type === 'month')?.value,
    day: parts.find((p) => p.type === 'day')?.value,
    hour: parts.find((p) => p.type === 'hour')?.value,
    minute: parts.find((p) => p.type === 'minute')?.value,
    second: parts.find((p) => p.type === 'second')?.value,
  };
}

function parseAndFormatPubDate(pubDateRaw) {
  if (!pubDateRaw) return '';

  const date = new Date(pubDateRaw);
  if (Number.isNaN(date.getTime())) {
    // Keep original value if unparseable.
    return pubDateRaw;
  }

  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatParts(dtf.formatToParts(date));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function parseItemsFromXml(xmlText) {
  const itemMatches = xmlText.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return itemMatches.map((itemXml) => {
    const pubDateRaw = getTagValue(itemXml, 'pubDate');
    return {
      item: {
        title: getTagValue(itemXml, 'title'),
        link: getTagValue(itemXml, 'link'),
        pubDate: parseAndFormatPubDate(pubDateRaw),
        category: getTagValue(itemXml, 'category'),
      },
    };
  });
}

function main() {
  if (!fs.existsSync(rssDir)) {
    throw new Error(`RSS directory not found: ${rssDir}`);
  }

  const files = fs
    .readdirSync(rssDir)
    .filter((file) => file.toLowerCase().endsWith('.xml'))
    .sort();

  const allItems = files.flatMap((file) => {
    const fullPath = path.join(rssDir, file);
    const xmlText = fs.readFileSync(fullPath, 'utf8');
    const items = parseItemsFromXml(xmlText);
    console.log(`[build-news-json] ${file}: ${items.length} items`);
    return items;
  });

  console.log(`[build-news-json] Total items: ${allItems.length}`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(allItems, null, 2), 'utf8');
  console.log(`Saved ${allItems.length} items to ${outputFile}`);
}

main();
