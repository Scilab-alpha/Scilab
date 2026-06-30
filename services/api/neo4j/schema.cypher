// SciLab Neo4j graph schema.
// Run this before importing or seeding academic graph data.

CREATE CONSTRAINT article_id_unique IF NOT EXISTS
FOR (article:Article)
REQUIRE article.id IS UNIQUE;

CREATE CONSTRAINT author_id_unique IF NOT EXISTS
FOR (author:Author)
REQUIRE author.id IS UNIQUE;

CREATE CONSTRAINT keyword_id_unique IF NOT EXISTS
FOR (keyword:Keyword)
REQUIRE keyword.id IS UNIQUE;

CREATE CONSTRAINT journal_id_unique IF NOT EXISTS
FOR (journal:Journal)
REQUIRE journal.id IS UNIQUE;

CREATE CONSTRAINT topic_id_unique IF NOT EXISTS
FOR (topic:Topic)
REQUIRE topic.id IS UNIQUE;

CREATE INDEX article_doi_normalized_index IF NOT EXISTS
FOR (article:Article)
ON (article.doi_normalized);

CREATE INDEX article_openalex_id_index IF NOT EXISTS
FOR (article:Article)
ON (article.openalex_id);

CREATE INDEX article_semantic_scholar_id_index IF NOT EXISTS
FOR (article:Article)
ON (article.semantic_scholar_id);

CREATE INDEX article_crossref_id_index IF NOT EXISTS
FOR (article:Article)
ON (article.crossref_id);

CREATE INDEX article_publication_year_index IF NOT EXISTS
FOR (article:Article)
ON (article.publication_year);

CREATE INDEX author_orcid_index IF NOT EXISTS
FOR (author:Author)
ON (author.orcid);

CREATE INDEX keyword_display_name_index IF NOT EXISTS
FOR (keyword:Keyword)
ON (keyword.display_name);

CREATE INDEX journal_source_id_index IF NOT EXISTS
FOR (journal:Journal)
ON (journal.source_id);

CREATE INDEX journal_display_name_index IF NOT EXISTS
FOR (journal:Journal)
ON (journal.display_name);

CREATE INDEX journal_country_index IF NOT EXISTS
FOR (journal:Journal)
ON (journal.country);

CREATE INDEX journal_region_index IF NOT EXISTS
FOR (journal:Journal)
ON (journal.region);

CREATE INDEX topic_display_name_index IF NOT EXISTS
FOR (topic:Topic)
ON (topic.display_name);

CREATE FULLTEXT INDEX article_title_abstract_fulltext IF NOT EXISTS
FOR (article:Article)
ON EACH [article.title, article.abstract];
