const fs = require('fs');
const path = require('path');

const rssDir = path.join(__dirname, 'RSS');
const outputFile = path.join(__dirname, 'news.json');

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

function parseItemsFromXml(xmlText) {
  const itemMatches = xmlText.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return itemMatches.map((itemXml) => ({
    item: {
      title: getTagValue(itemXml, 'title'),
      link: getTagValue(itemXml, 'link'),
      pubDate: getTagValue(itemXml, 'pubDate'),
      category: getTagValue(itemXml, 'category'),
    },
  }));
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
    return parseItemsFromXml(xmlText);
  });

  fs.writeFileSync(outputFile, JSON.stringify(allItems, null, 2), 'utf8');
  console.log(`Saved ${allItems.length} items to ${outputFile}`);
}

main();
