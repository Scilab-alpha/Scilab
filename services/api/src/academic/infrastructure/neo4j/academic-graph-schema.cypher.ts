export const ACADEMIC_GRAPH_SCHEMA_CYPHER = [
  `CREATE CONSTRAINT article_id_unique IF NOT EXISTS
   FOR (a:Article) REQUIRE a.id IS UNIQUE`,
  `CREATE INDEX article_doi_index IF NOT EXISTS
   FOR (a:Article) ON (a.doi)`,
  `CREATE INDEX article_publication_year_index IF NOT EXISTS
   FOR (a:Article) ON (a.publication_year)`,
  `CREATE CONSTRAINT author_id_unique IF NOT EXISTS
   FOR (a:Author) REQUIRE a.id IS UNIQUE`,
  `CREATE INDEX author_orcid_index IF NOT EXISTS
   FOR (a:Author) ON (a.orcid)`,
  `CREATE TEXT INDEX author_display_name_text IF NOT EXISTS
   FOR (a:Author) ON (a.display_name)`,
  `CREATE CONSTRAINT journal_id_unique IF NOT EXISTS
   FOR (j:Journal) REQUIRE j.id IS UNIQUE`,
  `CREATE INDEX journal_source_id_index IF NOT EXISTS
   FOR (j:Journal) ON (j.source_id)`,
  `CREATE TEXT INDEX journal_display_name_text IF NOT EXISTS
   FOR (j:Journal) ON (j.display_name)`,
  `CREATE CONSTRAINT keyword_id_unique IF NOT EXISTS
   FOR (k:Keyword) REQUIRE k.id IS UNIQUE`,
  `CREATE TEXT INDEX keyword_display_name_text IF NOT EXISTS
   FOR (k:Keyword) ON (k.display_name)`,
  `CREATE CONSTRAINT topic_id_unique IF NOT EXISTS
   FOR (t:Topic) REQUIRE t.id IS UNIQUE`,
  `CREATE TEXT INDEX topic_display_name_text IF NOT EXISTS
   FOR (t:Topic) ON (t.display_name)`,
] as const;
