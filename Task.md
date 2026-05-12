# Actions:

Format example: `2026-05-12 14:37`.

1. Remember current date and time. Use Barcelona local time. Use it later everywhere. When need to output time, use Time (24h): `HH:mm` format.
2. Download sources.
3. Find news on the downloaded sources.
4. Write result in JSON file: array of links, topics and titles. File should be in a folder: `YYYY-MM-DD`. File name in format: `HH-mm-sitedomain.json`.
5. Apply one dedupe policy explicitly: **rolling 24-hour window**.
   - Exclude any news item if the same link, topic, or title already appears in any JSON file created in the previous 24 hours, measured from current Barcelona local datetime (`now - 24h`).
   - Exclude any news item whose published datetime is older than 24 hours from current Barcelona local datetime.
6. Create/Update files with all news that pass step 5 dedupe policy in JSON files.
   - This repository uses only the rolling 24-hour window for dedupe (no calendar-day dedupe in `Europe/Madrid`).
   - Day boundary behavior: crossing midnight does not reset dedupe; inclusion/exclusion depends only on whether an item is within the last 24 hours.
   - Midnight examples (`Europe/Madrid`):
     - If current time is `2026-05-12 00:10`, an item seen at `2026-05-11 00:05` is **excluded** (within previous 24 hours), while an item seen at `2026-05-11 00:00` is **included** (older than 24 hours).
     - If current time is `2026-05-12 23:55`, an item seen at `2026-05-11 23:56` is **excluded** (within previous 24 hours), while an item seen at `2026-05-11 23:54` is **included** (older than 24 hours).
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
