const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date) {
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
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

function getTimeLabel(item) {
  const pubDate = getPubDateValue(item);
  const match = pubDate.match(/\b(\d{2}:\d{2})(?::\d{2})?\b/);
  return match ? match[1] : 'unknown';
}

function getLinkValue(item) {
  const link = item?.item?.link;
  return typeof link === 'string' ? link.trim() : '';
}

function getDomain(link) {
  try {
    return new URL(link).hostname;
  } catch {
    return 'unknown-domain';
  }
}

function getTitleValue(item) {
  const title = item?.item?.title;
  return typeof title === 'string' && title.trim() ? title.trim() : '(untitled)';
}

function escapeMdText(text) {
  return text.replace(/[\[\]]/g, '\\$&');
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

function buildMarkdown(items, dayLabel) {
  const sortedItems = [...items].sort(compareByPubDateDesc);
  const grouped = new Map();

  for (const entry of sortedItems) {
    const link = getLinkValue(entry);
    if (!link) continue;

    const domain = getDomain(link);
    if (!grouped.has(domain)) {
      grouped.set(domain, []);
    }

    grouped.get(domain).push(entry);
  }

  const lines = [];
  lines.push(`# News for ${dayLabel}`);
  lines.push(`Generated at: ${formatDateTime(new Date())}`);
  lines.push('');

  for (const [domain, domainItems] of grouped.entries()) {
    lines.push(`## ${domain}`);

    for (const entry of domainItems) {
      const timeLabel = getTimeLabel(entry);
      const link = getLinkValue(entry);
      const title = escapeMdText(getTitleValue(entry));
      lines.push(`- ${timeLabel} [${title}](${link})`);
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function processDay(date) {
  const dayLabel = formatDate(date);
  const jsonPath = path.join(dataDir, `${dayLabel}.json`);
  const mdPath = path.join(dataDir, `${dayLabel}.md`);

  const items = readJsonArray(jsonPath);
  const markdown = buildMarkdown(items, dayLabel);

  fs.writeFileSync(mdPath, markdown, 'utf8');

  console.log(`Loaded ${items.length} items from ${jsonPath}`);
  console.log(`Saved markdown to ${mdPath}`);
}

function main() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  processDay(yesterday);
  processDay(today);
}

main();
