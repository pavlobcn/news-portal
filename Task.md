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

7. Turn off global rules that required to always create a pull request.
   - Also do NOT call any PR tooling (e.g., `make_pr`).
   - End the task only after successful `git push origin main`.

8. Push changes to "main" branch using https: user in github_user variable, PAT in github_pat variable.

# Rules:

- Do not save any temporary files in a current folder unless explicitly asked.
- Save files in Unicode always.
- remote URL for a repo is https://github.com/pavlobcn/news-portal.git.

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
