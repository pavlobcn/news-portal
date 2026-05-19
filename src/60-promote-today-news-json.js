const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const promotedTodayFile = path.join(repoRoot, 'README.md');
const dataNewsFile = path.join(dataDir, 'news.json');
const rootNewsFile = path.join(repoRoot, 'news.json');

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function main() {
  const today = new Date();
  const todayFile = path.join(dataDir, `${formatDate(today)}.md`);
  const createdFiles = [];
  const deletedFiles = [];

  if (!fs.existsSync(todayFile)) {
    throw new Error(`Today's file not found: ${todayFile}`);
  }

  if (fs.existsSync(promotedTodayFile)) {
    fs.unlinkSync(promotedTodayFile);
    deletedFiles.push(promotedTodayFile);
  }

  fs.copyFileSync(todayFile, promotedTodayFile);
  createdFiles.push(promotedTodayFile);

  [dataNewsFile, rootNewsFile].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deletedFiles.push(filePath);
    }
  });

  console.log(`Created files: ${createdFiles.join(', ') || '(none)'}`);
  console.log(`Deleted files: ${deletedFiles.join(', ') || '(none)'}`);
}

main();
