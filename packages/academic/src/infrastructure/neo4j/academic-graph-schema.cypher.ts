export const ACADEMIC_GRAPH_SCHEMA_CYPHER = [
  `CREATE CONSTRAINT article_id_unique IF NOT EXISTS
   FOR (a:Article) REQUIRE a.id IS UNIQUE`,
  `CREATE INDEX article_doi_index IF NOT EXISTS
   FOR (a:Article) ON (a.doi)`,
  `CREATE INDEX article_doi_normalized_index IF NOT EXISTS
   FOR (a:Article) ON (a.doi_normalized)`,
  `CREATE CONSTRAINT article_openalex_id_unique IF NOT EXISTS
   FOR (a:Article) REQUIRE a.openalex_id IS UNIQUE`,
  `CREATE INDEX article_publication_year_index IF NOT EXISTS
   FOR (a:Article) ON (a.publication_year)`,
  `CREATE INDEX article_hydration_state_index IF NOT EXISTS
   FOR (a:Article) ON (a.hydration_state)`,
  `CREATE RANGE INDEX article_admin_listing_index IF NOT EXISTS
   FOR (a:Article) ON (a.hydration_state, a.last_synced_at, a.id)`,
  `CREATE RANGE INDEX article_admin_source_listing_index IF NOT EXISTS
   FOR (a:Article) ON (a.hydration_state, a.crawl_source, a.last_synced_at, a.id)`,
  `CREATE INDEX article_citation_count_index IF NOT EXISTS
   FOR (a:Article) ON (a.citation_count)`,
  `CREATE INDEX article_reference_discovered_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.reference_discovered_at)`,
  `CREATE INDEX article_ingested_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.ingested_at)`,
  `CREATE INDEX article_first_crawled_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.first_crawled_at)`,
  `CREATE INDEX article_last_synced_at_index IF NOT EXISTS
   FOR (a:Article) ON (a.last_synced_at)`,
  `CREATE INDEX article_crawl_source_index IF NOT EXISTS
   FOR (a:Article) ON (a.crawl_source)`,
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
  `CREATE INDEX journal_first_crawled_at_index IF NOT EXISTS
   FOR (j:Journal) ON (j.first_crawled_at)`,
  `CREATE INDEX journal_last_synced_at_index IF NOT EXISTS
   FOR (j:Journal) ON (j.last_synced_at)`,
  `CREATE RANGE INDEX journal_admin_listing_index IF NOT EXISTS
   FOR (j:Journal) ON (j.last_synced_at, j.id)`,
  `CREATE RANGE INDEX journal_admin_source_listing_index IF NOT EXISTS
   FOR (j:Journal) ON (j.crawl_source, j.last_synced_at, j.id)`,
  `CREATE INDEX journal_crawl_source_index IF NOT EXISTS
   FOR (j:Journal) ON (j.crawl_source)`,
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
