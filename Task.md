# Actions:

1. Remember current date and time. Use it later everywhere.
2. Download sources.
3. Find news on the downloaded sources.
4. Write result in JSON file: array of links, topics and titles. File should be in a folder: yyyy-mm-dd. File name in format: hh-MM-sitedomain.json.
5. Exclude in JSON files generated on previous step links to pages that exist in JSON files of the last 2 days or news with published day older than 1 day.
6. Create README.md page with all news from today in JSON files.
   - files (doublecheck how filter applied to put the news in a correct file):
    - news included in filter: README-excluded.md
      - add a short line which filter applied
      - duplicates from previous days should not be mentioned in any file
    - news not included in filter: README.md
  - Put on the top the time when file was created. Format: "yyyy-mm-dd hh:MM".
  - Group by website
  - Newer on top, oldest on bottom

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

# Sources (RSS feed):

- http://k.img.com.ua/rss/ua/all_news2.0.xml
- https://www.elperiodico.com/es/cds/rss/?id=board.xml
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/acb/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/euroliga/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/copa_del_rey/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/mundial_baloncesto/
- https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/subsection/mas_baloncesto/

# News filter:

- гороскопи
- лотереї
- спорт (але не баскетбол)
- ресторани, їжа
- трафік в Барселоні
- ситуація на дорогах
- вибори (але не президента України чи США)
- автомобілі
- телебачення
