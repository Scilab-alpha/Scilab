# SciLab Neo4j Cypher

The graph model follows `docs/ERD/ERD.md`.

Run schema constraints and indexes:

```powershell
Get-Content -Raw services/api/neo4j/schema.cypher | docker compose exec -T neo4j cypher-shell -u neo4j -p 12345678
```

Seed demo academic graph data:

```powershell
Get-Content -Raw services/api/neo4j/seed.cypher | docker compose exec -T neo4j cypher-shell -u neo4j -p 12345678
```

The seed keeps UUIDs aligned with PostgreSQL seed reference IDs:

- `Journal.id`: referenced by `journal_ranking.journal_id`
- `Article.id`: referenced by `user_bookmark.article_id`
- `Journal`, `Keyword`, `Topic` IDs: referenced by `user_follow.object_id`
