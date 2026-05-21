# Actions:

1. Run command:

```bash
node src/prepare-data.js
```

2. Define filter matching:

Update `news.json`: for each item add two new fields — `topic` (best matching topic from `filter.md`) and `topic_match_probability` (0..100 match score based on item title/category/description; 0 when no filter matches, 100 when very close, e.g. FC Barcelona football news => sport=100).

3. Run command:

Before running the bash commands, update `news.json`: for each item add two new fields — `topic` (best matching topic from `filter.md`) and `topic_match_probability` (0..100 match score based on item title/category/description; 0 when no filter matches, 100 when very close, e.g. FC Barcelona football news => sport=100).

```bash
node src/generate-summary.js
```
