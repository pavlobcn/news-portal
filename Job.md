# Actions:

1. Run command:

```bash
node src/prepare-data.js
```

2. Define filter matching with LLM (human-like understanding):

Use `Filter.md` as the source of topics and update `news.json`: for each item add two new fields:
- `topic` — best matching topic from `Filter.md`
- `topic_match_probability` — 0..100 score based on title/category/description semantic meaning

Rules for LLM matching:
- Match by meaning, not by exact keywords.
- Use title/category/description context as a human editor would.
- Keep `0` when nothing meaningfully matches.
- Use `100` for very close matches (e.g., FC Barcelona football news => `спорт=100`; boxing news => `спорт` with high score).

3. Run command:

```bash
node src/generate-summary.js
```
