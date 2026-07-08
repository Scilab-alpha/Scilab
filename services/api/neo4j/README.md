# SciLab Neo4j Cypher

The graph model follows `docs/ERD/ERD.md`.

Run schema constraints and indexes:

```powershell
Get-Content -Raw services/api/neo4j/schema.cypher | docker compose exec -T neo4j cypher-shell -u neo4j -p 12345678
```

Academic graph data is populated by the OpenAlex synchronization workflow.
