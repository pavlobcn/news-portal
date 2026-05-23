const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const rssDir = path.join(repoRoot, 'RSS');
const outputDir = path.join(repoRoot, 'data');
const outputFile = path.join(outputDir, 'news.json');
const filterFile = path.join(repoRoot, 'filter.md');

const TOPIC_RULES = [
  {
    topic: 'гороскопи',
    include: ['гороскоп', 'horoscope', 'zodiac', 'астролог'],
  },
  {
    topic: 'лотереї',
    include: ['лотере', 'loter', 'lottery', 'jackpot'],
  },
  {
    topic: 'спорт',
    include: ['спорт', 'sport', 'futbol', 'football', 'soccer', 'fc barcelona', 'barça'],
    exclude: ['basket', 'баскет'],
  },
  {
    topic: 'ресторани, їжа',
    include: ['restaurant', 'restaurante', 'рестора', 'food', 'comida', 'їжа', 'recipe', 'рецепт'],
  },
  {
    topic: 'трафік в Барселоні',
    include: ['barcelona traffic', 'trànsit barcelona', 'trafico barcelona', 'трафік барселон'],
  },
  {
    topic: 'ситуація на дорогах',
    include: ['road', 'carretera', 'дорог', 'highway', 'accident', 'jam', 'congestion', 'mobility'],
  },
  {
    topic: 'вибори',
    include: ['election', 'elections', 'eleccions', 'вибор'],
    exclude: ['president of ukraine', 'president of the united states', 'president of usa', 'presidencial usa', 'president ukraine', 'president usa', 'usa president', 'ukraine president', 'сша президент', 'президент україни'],
  },
  {
    topic: 'автомобілі',
    include: ['авто', 'automobile', 'car ', 'cars', 'vehicle', 'tesla', 'bmw', 'toyota'],
  },
  {
    topic: 'телебачення',
    include: ['tv', 'television', 'televi', 'телебач', 'series', 'show'],
  },
];

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
    const title = getTagValue(itemXml, 'title');
    const category = getTagValue(itemXml, 'category');
    const description = getTagValue(itemXml, 'description');
    const { topic, probability } = matchTopic({ title, category, description });

    return {
      item: {
        title,
        link: getTagValue(itemXml, 'link'),
        pubDate: parseAndFormatPubDate(pubDateRaw),
        category,
        description,
        topic,
        topic_match_probability: probability,
      },
    };
  });
}

function getFilterTopicsFromMarkdown() {
  if (!fs.existsSync(filterFile)) return [];
  const lines = fs.readFileSync(filterFile, 'utf8').split('\n');
  return lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .map((line) => line.split('(')[0].trim())
    .filter(Boolean);
}

function normalizeText(value = '') {
  return String(value).toLowerCase();
}

function estimateProbability(hits, combinedText) {
  const hitCount = hits.length;
  if (hitCount === 0) return 0;

  const hasSportSpecific = /fc barcelona|barça|futbol|football|soccer/.test(combinedText);
  if (hasSportSpecific && hits.some((hit) => /fc barcelona|barça/.test(hit))) {
    return 100;
  }

  if (hitCount >= 3) return 95;
  if (hitCount === 2) return 85;
  return 70;
}

function matchTopic({ title = '', category = '', description = '' }) {
  const combinedText = normalizeText(`${title} ${category} ${description}`);
  let best = { topic: '', probability: 0 };

  for (const rule of TOPIC_RULES) {
    const excluded = (rule.exclude || []).some((token) => combinedText.includes(token));
    if (excluded) continue;

    const hits = rule.include.filter((token) => combinedText.includes(token));
    const probability = estimateProbability(hits, combinedText);

    if (probability > best.probability) {
      best = { topic: rule.topic, probability };
    }
  }

  return best;
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
  const declaredTopics = new Set(getFilterTopicsFromMarkdown());
  const activeRules = TOPIC_RULES.filter((rule) => declaredTopics.has(rule.topic));
  if (activeRules.length > 0) {
    TOPIC_RULES.length = 0;
    TOPIC_RULES.push(...activeRules);
  }
