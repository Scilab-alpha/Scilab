export const ACADEMIC_GRAPH_SCHEMA_CYPHER = [
  `CREATE CONSTRAINT article_id_unique IF NOT EXISTS
   FOR (a:Article) REQUIRE a.id IS UNIQUE`,
  `CREATE INDEX article_doi_index IF NOT EXISTS
   FOR (a:Article) ON (a.doi)`,
  `CREATE INDEX article_publication_year_index IF NOT EXISTS
   FOR (a:Article) ON (a.publication_year)`,
  `CREATE INDEX article_hydration_state_index IF NOT EXISTS
   FOR (a:Article) ON (a.hydration_state)`,
  `CREATE INDEX article_citation_count_index IF NOT EXISTS
   FOR (a:Article) ON (a.citation_count)`,
  `CREATE INDEX article_reference_discovered_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.reference_discovered_at)`,
  `CREATE INDEX article_ingested_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.ingested_at)`,
  `CREATE INDEX article_citation_count_updated_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.citation_count_updated_at)`,
  `CREATE INDEX article_outgoing_references_crawled_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.outgoing_references_crawled_at)`,
  `CREATE INDEX article_related_sync_eligible_index IF NOT EXISTS
   FOR (a:Article) ON (a.related_sync_eligible)`,
  `CREATE INDEX article_related_works_synced_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.related_works_synced_at)`,
  `CREATE INDEX article_work_type_index IF NOT EXISTS
   FOR (a:Article) ON (a.work_type)`,
  `CREATE FULLTEXT INDEX article_title_abstract_fulltext IF NOT EXISTS
   FOR (a:Article) ON EACH [a.title, a.abstract]
   OPTIONS {indexConfig: {
     \`fulltext.analyzer\`: 'standard-no-stop-words',
     \`fulltext.eventually_consistent\`: false
   }}`,
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
  `CREATE INDEX journal_scimago_source_id_index IF NOT EXISTS
   FOR (j:Journal) ON (j.scimago_source_id)`,
  `CREATE TEXT INDEX journal_display_name_text IF NOT EXISTS
   FOR (j:Journal) ON (j.display_name)`,
  `CREATE INDEX journal_publisher_name_normalized_index IF NOT EXISTS
   FOR (j:Journal) ON (j.publisher_name_normalized)`,
  `CREATE CONSTRAINT keyword_id_unique IF NOT EXISTS
   FOR (k:Keyword) REQUIRE k.id IS UNIQUE`,
  `CREATE TEXT INDEX keyword_display_name_text IF NOT EXISTS
   FOR (k:Keyword) ON (k.display_name)`,
  `CREATE CONSTRAINT topic_id_unique IF NOT EXISTS
   FOR (t:Topic) REQUIRE t.id IS UNIQUE`,
  `CREATE TEXT INDEX topic_display_name_text IF NOT EXISTS
   FOR (t:Topic) ON (t.display_name)`,
] as const;
