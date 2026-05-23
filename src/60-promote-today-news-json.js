const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");
const promotedTodayFile = path.join(repoRoot, "README.md");
const dataNewsFile = path.join(dataDir, "news.json");

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

  const promotedContent = fs.readFileSync(promotedTodayFile, "utf8");
  const fixedPromotedContent = promotedContent.replace(
    /(Previous day:\s*\[\d{4}-\d{2}-\d{2}\]\()\.\//g,
    "$1./data/",
  );

  if (fixedPromotedContent !== promotedContent) {
    fs.writeFileSync(promotedTodayFile, fixedPromotedContent, "utf8");
  }

  createdFiles.push(promotedTodayFile);

  if (fs.existsSync(dataNewsFile)) {
    // do not delete news.json file for debug
    // fs.unlinkSync(dataNewsFile);
    // deletedFiles.push(dataNewsFile);
  }

  console.log(`Created files: ${createdFiles.join(", ") || "(none)"}`);
  console.log(`Deleted files: ${deletedFiles.join(", ") || "(none)"}`);
}

main();
