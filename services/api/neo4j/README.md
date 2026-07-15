# SciLab Neo4j Cypher

The graph model follows `docs/ERD/ERD.md`.

Run schema constraints and indexes:

```powershell
pnpm --filter api neo4j:schema
```

The command and the API startup initializer use the same TypeScript schema
definition so constraints and indexes cannot drift between environments.

Run the idempotent search-data backfill after deploying hydration, publisher,
and citation fields:

```powershell
pnpm --filter api academic:backfill-search-data
```

Academic graph data is populated by the OpenAlex synchronization workflow.
