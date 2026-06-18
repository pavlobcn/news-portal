const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");
const topicsFile = path.join(repoRoot, "Filter.md");
const MIN_TOPIC_MATCH_PROBABILITY = 20;
const PREFERRED_DOMAIN_ORDER = [
  "ua.korrespondent.net",
  "as.com",
  "www.elperiodico.com",
];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

const BARCELONA_TIMEZONE = "Europe/Madrid";

function formatDateTime(date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BARCELONA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function readTopicOrder(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1]?.trim() || "")
    .map((topic) => topic.replace(/\s+\(.+\)$/, "").trim())
    .filter(Boolean);
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array in: ${filePath}`);
  }

  return parsed;
}

function getPubDateValue(item) {
  const pubDate = item?.pubDate;
  return typeof pubDate === "string" ? pubDate.trim() : "";
}

function getTimeLabel(item) {
  const pubDate = getPubDateValue(item);
  const match = pubDate.match(/\b(\d{2}:\d{2})(?::\d{2})?\b/);
  return match ? match[1] : "";
}

function getLinkValue(item) {
  const link = item?.link;
  return typeof link === "string" ? link.trim() : "";
}

function getDomain(link) {
  try {
    return new URL(link).hostname;
  } catch {
    return "unknown-domain";
  }
}

function getTitleValue(item) {
  const title = item?.title;
  return typeof title === "string" && title.trim()
    ? title.trim()
    : "(untitled)";
}

function escapeMdText(text) {
  return text.replace(/[\[\]]/g, "\\$&");
}

function getTopicValue(item) {
  const topic = item?.topic;
  if (typeof topic !== "string") return "";
  const normalized = topic.trim();
  return normalized && normalized.toLowerCase() !== "unknown" ? normalized : "";
}

function getTopicMatchProbabilityNumber(item) {
  const value = item?.topic_match_probability;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function getTopicMatchProbabilityValue(item) {
  const value = getTopicMatchProbabilityNumber(item);
  return value === null ? "" : String(Math.round(value));
}

function getCategoryValue(item) {
  const category = item?.category;
  if (typeof category !== "string") return "";
  const normalized = category.trim();
  return normalized && normalized.toLowerCase() !== "unknown" ? normalized : "";
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

function isTopicMatch(entry) {
  const topic = getTopicValue(entry);
  const topicMatchProbability = getTopicMatchProbabilityNumber(entry);

  return (
    Boolean(topic) &&
    topicMatchProbability !== null &&
    topicMatchProbability >= MIN_TOPIC_MATCH_PROBABILITY
  );
}

function addGroupedEntry(grouped, groupName, entry) {
  if (!grouped.has(groupName)) {
    grouped.set(groupName, []);
  }

  grouped.get(groupName).push(entry);
}

function compareTopicsByFilterOrder(topicOrder) {
  return (a, b) => {
    const indexA = topicOrder.indexOf(a);
    const indexB = topicOrder.indexOf(b);
    const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return a.localeCompare(b);
  };
}

function buildMarkdown(items, previousDayLabel, topicOrder = []) {
  const sortedItems = [...items].sort(compareByPubDateDesc);
  const topicGroups = new Map();
  const ungroupedByDomain = new Map();
  let addedItemCount = 0;

  for (const entry of sortedItems) {
    const link = getLinkValue(entry);
    if (!link) continue;

    if (isTopicMatch(entry)) {
      addGroupedEntry(topicGroups, getTopicValue(entry), entry);
    } else {
      addGroupedEntry(ungroupedByDomain, getDomain(link), entry);
    }

    addedItemCount += 1;
  }

  const lines = [];
  lines.push(`# News for ${formatDateTime(new Date())}`);
  lines.push("");

  if (previousDayLabel) {
    lines.push(`Previous day: [${previousDayLabel}](./${previousDayLabel}.md)`);
    lines.push("");
  }

  const orderedTopics = [...topicGroups.keys()].sort(compareTopicsByFilterOrder(topicOrder));

  if (orderedTopics.length > 0) {
    lines.push("## Topics");
    lines.push("");

    for (const topic of orderedTopics) {
      lines.push(`### ${escapeMdText(topic)}`);

      for (const entry of topicGroups.get(topic)) {
        const timeLabel = getTimeLabel(entry);
        const link = getLinkValue(entry);
        const title = escapeMdText(getTitleValue(entry));
        const domain = getDomain(link);
        lines.push(`${timeLabel} [${title}](${link}) _${domain}_<br>`);
      }

      lines.push("");
    }
  }

  const orderedDomains = [...ungroupedByDomain.keys()].sort((a, b) => {
    const indexA = PREFERRED_DOMAIN_ORDER.indexOf(a);
    const indexB = PREFERRED_DOMAIN_ORDER.indexOf(b);
    const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return a.localeCompare(b);
  });

  if (orderedDomains.length > 0) {
    lines.push("## Other news");
    lines.push("");
  }

  for (const domain of orderedDomains) {
    const domainItems = ungroupedByDomain.get(domain);
    lines.push(`### ${domain}`);

    for (const entry of domainItems) {
      const timeLabel = getTimeLabel(entry);
      const link = getLinkValue(entry);
      const title = escapeMdText(getTitleValue(entry));
      const topic = escapeMdText(getTopicValue(entry));
      const topicMatchProbability = getTopicMatchProbabilityValue(entry);
      const category = escapeMdText(getCategoryValue(entry));
      // DEBUG: Topic match info
      // lines.push(`${topicMatchProbability} | ${topic} | ${category}<br>`);
      lines.push(`${timeLabel} [${title}](${link})<br>`);
    }

    lines.push("");
  }

  return {
    markdown: lines.join("\n").trimEnd() + "\n",
    addedItemCount,
  };
}

function processDay(date) {
  const dayLabel = formatDate(date);
  const jsonPath = path.join(dataDir, `${dayLabel}.json`);
  const mdPath = path.join(dataDir, `${dayLabel}.md`);

  const previousDay = new Date(date);
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  const previousDayLabel = formatDate(previousDay);
  const previousMdPath = path.join(dataDir, `${previousDayLabel}.md`);

  const items = readJsonArray(jsonPath);
  const topicOrder = readTopicOrder(topicsFile);
  const { markdown, addedItemCount } = buildMarkdown(
    items,
    fs.existsSync(previousMdPath) ? previousDayLabel : null,
    topicOrder,
  );

  fs.writeFileSync(mdPath, markdown, "utf8");

  console.log(`Loaded ${items.length} items from ${jsonPath}`);
  console.log(`Added ${addedItemCount} items to ${mdPath}`);
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
