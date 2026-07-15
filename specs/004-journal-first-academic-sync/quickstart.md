# Quickstart Validation

1. Configure OpenAlex credentials and journal sync environment values.
2. Run the consolidated Prisma deployment against a fresh database.
3. Reload the SCImago dataset, resolve sources, and confirm match counts.
4. Run article synchronization twice; confirm cursors resume and insert/update
   counts are accurate without citation edges from listing pages.
5. Run outgoing reference crawl and confirm only that job creates `CITES`.
6. Fetch a matched ranking and traverse journal, articles, and article detail.
