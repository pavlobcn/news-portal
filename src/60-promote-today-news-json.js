const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const rootNewsFile = path.join(repoRoot, 'news.json');

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function main() {
  const today = new Date();
  const todayFile = path.join(dataDir, `${formatDate(today)}.json`);

  if (!fs.existsSync(todayFile)) {
    throw new Error(`Today's file not found: ${todayFile}`);
  }

  if (fs.existsSync(rootNewsFile)) {
    fs.unlinkSync(rootNewsFile);
    console.log(`Deleted ${rootNewsFile}`);
  }

  fs.copyFileSync(todayFile, rootNewsFile);
  console.log(`Copied ${todayFile} to ${rootNewsFile}`);
}

main();
