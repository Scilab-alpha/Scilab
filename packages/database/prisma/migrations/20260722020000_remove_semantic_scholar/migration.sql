DELETE FROM "sync_log"
WHERE "source"::text = 'SEMANTIC_SCHOLAR'
   OR "job_type"::text = 'SEMANTIC_SCHOLAR_JOURNAL_SUPPLEMENT';

DELETE FROM "academic_job_audit"
WHERE "job_id" ILIKE 'semantic-scholar-journal-supplemen%';

DELETE FROM "academic_job_run"
WHERE "job_id" ILIKE 'semantic-scholar-journal-supplemen%';

DELETE FROM "academic_job_control"
WHERE "job_id" ILIKE 'semantic-scholar-journal-supplemen%';

DELETE FROM "system_config"
WHERE lower("api_name") LIKE '%semantic%scholar%'
   OR lower("api_endpoint") LIKE '%semanticscholar%';

DROP INDEX IF EXISTS "academic_journal_sync_state_semantic_scholar_status_catalog_year_idx";

ALTER TABLE "academic_journal_sync_state"
  DROP COLUMN IF EXISTS "semantic_scholar_status",
  DROP COLUMN IF EXISTS "semantic_scholar_new_token",
  DROP COLUMN IF EXISTS "semantic_scholar_new_accepted",
  DROP COLUMN IF EXISTS "semantic_scholar_related_accepted",
  DROP COLUMN IF EXISTS "semantic_scholar_processed_seed_ids",
  DROP COLUMN IF EXISTS "semantic_scholar_started_at",
  DROP COLUMN IF EXISTS "semantic_scholar_completed_at",
  DROP COLUMN IF EXISTS "semantic_scholar_error_detail";

DROP TYPE IF EXISTS "semantic_scholar_supplement_status";

CREATE TYPE "sync_source_next" AS ENUM (
  'OPENALEX',
  'CROSSREF',
  'SCIMAGO',
  'NEO4J',
  'SYSTEM'
);

ALTER TABLE "sync_log"
  ALTER COLUMN "source" TYPE "sync_source_next"
  USING "source"::text::"sync_source_next";

ALTER TYPE "sync_source" RENAME TO "sync_source_legacy";
ALTER TYPE "sync_source_next" RENAME TO "sync_source";
DROP TYPE "sync_source_legacy";

CREATE TYPE "sync_job_type_next" AS ENUM (
  'SCHEDULED_SYNC',
  'MANUAL_SYNC',
  'ORPHAN_CLEANUP',
  'TREND_AGGREGATION',
  'ALERT_DISPATCH',
  'SCIMAGO_RELOAD',
  'REFERENCE_HYDRATION',
  'INCOMING_CITATION_CRAWL',
  'CITATION_COUNT_REFRESH',
  'JOURNAL_SOURCE_SYNC',
  'JOURNAL_ARTICLE_SYNC',
  'RELATED_WORK_SYNC',
  'RELATED_WORK_HYDRATION',
  'OUTGOING_REFERENCE_CRAWL'
);

ALTER TABLE "sync_log"
  ALTER COLUMN "job_type" TYPE "sync_job_type_next"
  USING "job_type"::text::"sync_job_type_next";

ALTER TYPE "sync_job_type" RENAME TO "sync_job_type_legacy";
ALTER TYPE "sync_job_type_next" RENAME TO "sync_job_type";
DROP TYPE "sync_job_type_legacy";
