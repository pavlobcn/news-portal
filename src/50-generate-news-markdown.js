const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");
const PREFERRED_DOMAIN_ORDER = [
  "ua.korrespondent.net",
  "as.com",
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  return 0;
}

function buildMarkdown(items, previousDayLabel) {
  const sortedItems = [...items].sort(compareByPubDateDesc);
  const grouped = new Map();
  let addedItemCount = 0;

  for (const entry of sortedItems) {
    const link = getLinkValue(entry);
    if (!link) continue;

    const topicMatchProbability = getTopicMatchProbabilityNumber(entry);
    if (topicMatchProbability !== null && topicMatchProbability >= 20) {
      continue;
    }

    const domain = getDomain(link);
    if (!grouped.has(domain)) {
      grouped.set(domain, []);
    }

    grouped.get(domain).push(entry);
    addedItemCount += 1;
  }

    lines.push("");
  }

  const orderedDomains = [...grouped.keys()].sort((a, b) => {
    const indexA = PREFERRED_DOMAIN_ORDER.indexOf(a);
    const indexB = PREFERRED_DOMAIN_ORDER.indexOf(b);
    const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    return a.localeCompare(b);
  });

  for (const domain of orderedDomains) {
    const domainItems = grouped.get(domain);
    lines.push(`## ${domain}`);

    for (const entry of domainItems) {
      const timeLabel = getTimeLabel(entry);
  const previousMdPath = path.join(dataDir, `${previousDayLabel}.md`);

  const items = readJsonArray(jsonPath);
  const { markdown, addedItemCount } = buildMarkdown(
    items,
    fs.existsSync(previousMdPath) ? previousDayLabel : null,
  );

  fs.writeFileSync(mdPath, markdown, "utf8");
