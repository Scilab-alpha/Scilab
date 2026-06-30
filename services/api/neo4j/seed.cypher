// SciLab Neo4j seed data.
// This file is idempotent and uses MERGE around stable UUID reference IDs.

MERGE (journal:Journal {id: '77777777-7777-4777-8777-777777777771'})
SET
  journal.source_id = 'openalex:S4306525036',
  journal.display_name = 'Journal of Artificial Intelligence Research',
  journal.type = 'journal',
  journal.is_open_access = true,
  journal.is_oa_diamond = false,
  journal.coverage = '1993-present',
  journal.country = 'United States',
  journal.region = 'North America',
  journal.issn_list = ['1076-9757'],
  journal.issn_normalized_list = ['10769757'],
  journal.publisher_name = 'AI Access Foundation',
  journal.publisher_image_url = null,
  journal.subject_categories = ['Artificial Intelligence', 'Computer Science'],
  journal.created_at = datetime('2026-06-30T01:00:00Z'),
  journal.updated_at = datetime('2026-06-30T01:00:00Z');

MERGE (softwareJournal:Journal {id: '77777777-7777-4777-8777-777777777772'})
SET
  softwareJournal.source_id = 'openalex:S4210178759',
  softwareJournal.display_name = 'Empirical Software Engineering',
  softwareJournal.type = 'journal',
  softwareJournal.is_open_access = false,
  softwareJournal.is_oa_diamond = false,
  softwareJournal.coverage = '1996-present',
  softwareJournal.country = 'Netherlands',
  softwareJournal.region = 'Europe',
  softwareJournal.issn_list = ['1382-3256', '1573-7616'],
  softwareJournal.issn_normalized_list = ['13823256', '15737616'],
  softwareJournal.publisher_name = 'Springer Nature',
  softwareJournal.publisher_image_url = null,
  softwareJournal.subject_categories = ['Software Engineering', 'Computer Science'],
  softwareJournal.created_at = datetime('2026-06-30T01:00:00Z'),
  softwareJournal.updated_at = datetime('2026-06-30T01:00:00Z');

MERGE (an:Author {id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'})
SET
  an.orcid = '0000-0002-1825-0097',
  an.display_name = 'An Nguyen',
  an.url_image = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e';

MERGE (maya:Author {id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'})
SET
  maya.orcid = '0000-0003-1415-9265',
  maya.display_name = 'Maya Chen',
  maya.url_image = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2';

MERGE (linh:Author {id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'})
SET
  linh.orcid = '0000-0002-1694-233X',
  linh.display_name = 'Linh Tran',
  linh.url_image = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';

MERGE (ml:Keyword {id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1'})
SET ml.display_name = 'machine learning';

MERGE (openScience:Keyword {id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2'})
SET openScience.display_name = 'open science';

MERGE (softwareQuality:Keyword {id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3'})
SET softwareQuality.display_name = 'software quality';

MERGE (aiTopic:Topic {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'})
SET
  aiTopic.display_name = 'Artificial Intelligence',
  aiTopic.score = 0.96;

MERGE (retrievalTopic:Topic {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'})
SET
  retrievalTopic.display_name = 'Neural Information Retrieval',
  retrievalTopic.score = 0.94;

MERGE (reproTopic:Topic {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'})
SET
  reproTopic.display_name = 'Research Reproducibility',
  reproTopic.score = 0.88;

MERGE (article:Article {id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'})
SET
  article.title = 'Benchmarking Neural Retrieval Models for Scientific Discovery',
  article.abstract = 'A comparative study of dense retrieval methods over scholarly corpora.',
  article.doi = '10.5555/scilab.2026.1001',
  article.doi_normalized = '10.5555/scilab.2026.1001',
  article.openalex_id = 'https://openalex.org/W4306525036',
  article.semantic_scholar_id = 'S2-SCILAB-1001',
  article.crossref_id = '10.5555/scilab.2026.1001',
  article.publication_year = 2026,
  article.version = 'v1',
  article.volume_number = '14',
  article.issue_number = '1',
  article.created_at = datetime('2026-06-30T01:00:00Z'),
  article.updated_at = datetime('2026-06-30T01:00:00Z');

MERGE (softwareArticle:Article {id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'})
SET
  softwareArticle.title = 'Test Automation Strategies for Multi-Platform Research Tools',
  softwareArticle.abstract = 'An empirical report on test suites for web, mobile, and API research systems.',
  softwareArticle.doi = '10.5555/scilab.2026.1002',
  softwareArticle.doi_normalized = '10.5555/scilab.2026.1002',
  softwareArticle.openalex_id = 'https://openalex.org/W4306525037',
  softwareArticle.semantic_scholar_id = 'S2-SCILAB-1002',
  softwareArticle.crossref_id = '10.5555/scilab.2026.1002',
  softwareArticle.publication_year = 2026,
  softwareArticle.version = 'v1',
  softwareArticle.volume_number = '9',
  softwareArticle.issue_number = '2',
  softwareArticle.created_at = datetime('2026-06-30T01:00:00Z'),
  softwareArticle.updated_at = datetime('2026-06-30T01:00:00Z');

MATCH
  (journal:Journal {id: '77777777-7777-4777-8777-777777777771'}),
  (softwareJournal:Journal {id: '77777777-7777-4777-8777-777777777772'}),
  (an:Author {id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'}),
  (maya:Author {id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'}),
  (linh:Author {id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'}),
  (ml:Keyword {id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1'}),
  (openScience:Keyword {id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2'}),
  (softwareQuality:Keyword {id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3'}),
  (aiTopic:Topic {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'}),
  (retrievalTopic:Topic {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'}),
  (reproTopic:Topic {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'}),
  (article:Article {id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'}),
  (softwareArticle:Article {id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'})
MERGE (an)-[anWrote:WROTE]->(article)
SET anWrote.author_position = 1
MERGE (maya)-[mayaWrote:WROTE]->(article)
SET mayaWrote.author_position = 2
MERGE (linh)-[linhWrote:WROTE]->(softwareArticle)
SET linhWrote.author_position = 1
MERGE (article)-[articleKeyword:HAS_KEYWORD]->(ml)
SET articleKeyword.score = 0.96
MERGE (article)-[articleOpenScience:HAS_KEYWORD]->(openScience)
SET articleOpenScience.score = 0.72
MERGE (softwareArticle)-[softwareKeyword:HAS_KEYWORD]->(softwareQuality)
SET softwareKeyword.score = 0.93
MERGE (article)-[:PUBLISHED_IN]->(journal)
MERGE (softwareArticle)-[:PUBLISHED_IN]->(softwareJournal)
MERGE (article)-[articleTopic:BELONGS_TO]->(retrievalTopic)
SET articleTopic.is_primary = true
MERGE (article)-[articleParentTopic:BELONGS_TO]->(aiTopic)
SET articleParentTopic.is_primary = false
MERGE (softwareArticle)-[softwareTopic:BELONGS_TO]->(reproTopic)
SET softwareTopic.is_primary = true
MERGE (article)-[:CITES]->(softwareArticle)
MERGE (aiTopic)-[:PARENT_OF]->(retrievalTopic);
