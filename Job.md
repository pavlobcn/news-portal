# Actions:

1. Execute scripts (in the exact order), output all logs from executed scripts to a summary (will be used for debugging):
   - 10-download-rss.js
   - 20-build-news-json.js
   - 30-prune-news-by-recent-days.js
   - 35-join-yesterday-today-news.js
   - 40-split-news-by-day.js 
   - 50-generate-news-markdown.js 
   - 60-promote-today-news-json.js
   - 70-push-json-md-to-main.js


Run command:

```bash
node src/main.js
```
