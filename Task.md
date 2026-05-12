# Actions:

Format example: `2026-05-12 14:37`.

1. Remember current date and time. Use Barcelona local time. Use it later everywhere. When need to output time, use Time (24h): `HH:mm` format.
2. Download sources.
3. Find news on the downloaded sources.
4. Write result in JSON file: array of links, topics and titles. File should be in a folder: `YYYY-MM-DD`. File name in format: `HH-mm-sitedomain.json`.
5. Exclude in JSON files generated on previous step links to pages that exist in JSON files of the last 24 hours or news with published day older than 24 hours.
6. Create/Update files with all news from today in JSON files.
   - Put on the top the time when file was created.
   - Group by website (not from RSS Feed but by target link domain)
   - Newer on top, oldest on bottom
   - news duplicates from previous days should not be mentioned in any file
   - for each news (using topic and title) define boolean attribute to decide if it's included in New Filter or not
     - double check this decision
   - files:
     - README-excluded.md
       - include in this file news which titles or topics are mentioned in News Filter
       - add a short line which filter applied
     - README.md
       - include in this file news which titles or topic are NOT mentioned in News Filter

7. Set remote URL for a repo: https://github.com/pavlobcn/news-portal.git.
8. Push changes to "main" branch using https: user in github_user variable, PAT in github_pat variable.
9. Mandatory verification and completion gate:
   - Run and include outputs of:
     - `git branch --show-current`
     - `git rev-parse HEAD`
     - `git ls-remote --heads origin main`
   - The task is complete only when `git push origin main` succeeds and `git ls-remote --heads origin main` points to the same commit as `git rev-parse HEAD`.
   - If push fails, stop and report failure with stderr; do not mark task complete.

# Rules:

- Do not save any temporary files in a current folder unless explicitly asked.
- Save files in Unicode always.
- Always use these formats:
  - Date: `YYYY-MM-DD`
  - Time (24h): `HH:mm`
  - Datetime: `YYYY-MM-DD HH:mm`

# Sources (RSS feed):

- http://k.img.com.ua/rss/ua/all_news2.0.xml
- https://www.elperiodico.com/es/cds/rss/?id=board.xml
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/acb/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/euroliga/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/copa_del_rey/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/mundial_baloncesto/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/mas_baloncesto/

# News Filter:

- гороскопи
- лотереї
- спорт (але не баскетбол)
- ресторани, їжа
- трафік в Барселоні
- ситуація на дорогах
- вибори (але не президента України чи США)
- автомобілі
- телебачення

# Output Record Schema and Filter Behavior (Strict)

## Output JSON record schema

Each record in generated `YYYY-MM-DD/HH-mm-sitedomain.json` files **must** follow this strict schema:

- `link`: string, absolute URL to the news page.
- `topic`: string, topic/category as parsed from feed (can be empty string if source does not provide one).
- `title`: string, news title.
- `published_at`: string, datetime in source format or normalized `YYYY-MM-DD HH:mm` when available.
- `is_filtered_out`: boolean (`true` or `false`) indicating whether the item matches **News Filter**.
- `filter_reason`: string, required when `is_filtered_out=true`; empty string or omitted when `is_filtered_out=false`.

Boolean polarity is strict:
- `is_filtered_out=true` → item is excluded by filter.
- `is_filtered_out=false` → item is included (not excluded by filter).

## Filter matching rules

Apply filter decision against the **meaning** of the item (using `title`, `topic`, and link context when needed), not by literal text pattern checks.

1. Semantic/human-understanding match:
   - "Matching filter" means the news is about a filtered topic by human understanding.
   - Do **not** treat filter decision as substring, token, regex, or keyword-only matching.
2. Language handling:
   - Evaluate meaning in the original language of the item.
   - Variants, inflections, synonyms, and paraphrases count as matches when they express the same filtered topic.
3. Ambiguity handling:
   - If uncertain, prefer conservative exclusion (`is_filtered_out=true`) and explain uncertainty in `filter_reason`.
4. Special rule:
   - `спорт (але не баскетбол)` means sport-related items are filtered out **except** basketball items.

## `filter_reason` requirement

When `is_filtered_out=true`, `filter_reason` is mandatory and must contain:
- the matched filter category (for example: `sport_not_basketball`, `traffic_barcelona`, `tv`), and
- a short human-readable explanation of what matched (`title`, `topic`, or both).

When `is_filtered_out=false`, `filter_reason` should be empty string or omitted.

## README alignment rules (testable)

Inclusion in markdown files must be derived only from `is_filtered_out`:

- `README.md`: include only items where `is_filtered_out=false`.
- `README-excluded.md`: include only items where `is_filtered_out=true`, and show short filter note derived from `filter_reason`.

This alignment is mandatory so behavior is deterministic and testable.
