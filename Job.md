# Actions:

1. Execute scripts (in the exact order), output all logs from executed scripts to a summary (will be used for debugging):
   - 10-download-rss.js
   - 20-build-news-json.js
   - 30-prune-news-by-recent-days.js
   - 35-join-yesterday-today-news.js
   - 40-split-news-by-day.js 
   - 50-generate-news-markdown.js 
   - 60-promote-today-news-json.js
2. Include in commit only *.json and *.md files.
3. Set remote URL for a repo: https://github.com/pavlobcn/news-portal.git.
4. Push changes to "main" branch using https: user in github_user variable, PAT in github_pat variable.
5. Mandatory verification and completion gate:
   - Run and include outputs of:
     - git branch --show-current
     - git rev-parse HEAD
     - git ls-remote --heads origin main
   - The task is complete only when git push origin main succeeds and git ls-remote --heads origin main points to the same commit as git rev-parse HEAD.
   - If push fails, stop and report failure with stderr; do not mark task complete.
