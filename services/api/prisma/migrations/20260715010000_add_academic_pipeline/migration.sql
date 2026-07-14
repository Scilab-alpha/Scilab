ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'SCIMAGO_RELOAD';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'REFERENCE_HYDRATION';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'INCOMING_CITATION_CRAWL';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'CITATION_COUNT_REFRESH';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'JOURNAL_SOURCE_SYNC';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'JOURNAL_ARTICLE_SYNC';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'OUTGOING_REFERENCE_CRAWL';

DO $$ BEGIN
  CREATE TYPE "academic_journal_match_status" AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED', 'CONFLICT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "academic_journal_sync_mode" AS ENUM ('BACKFILL', 'INCREMENTAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "academic_journal_sync_state" (
  "scimago_source_id" VARCHAR(64) NOT NULL,
  "catalog_year" INTEGER NOT NULL,
  "openalex_journal_id" VARCHAR(255),
  "match_status" "academic_journal_match_status" NOT NULL DEFAULT 'PENDING',
  "matched_issn" VARCHAR(32),
  "candidate_journal_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sync_mode" "academic_journal_sync_mode" NOT NULL DEFAULT 'BACKFILL',
  "cursor" TEXT,
  "filter_signature" VARCHAR(128),
  "incremental_window_from" TIMESTAMP(6),
  "initial_backfill_complete" BOOLEAN NOT NULL DEFAULT false,
  "last_resolved_at" TIMESTAMP(6),
  "last_successful_at" TIMESTAMP(6),
  "error_detail" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "academic_journal_sync_state_pkey" PRIMARY KEY ("scimago_source_id")
);

CREATE UNIQUE INDEX "academic_journal_sync_state_openalex_journal_id_key"
  ON "academic_journal_sync_state"("openalex_journal_id");
CREATE INDEX "academic_journal_sync_state_match_status_catalog_year_idx"
  ON "academic_journal_sync_state"("match_status", "catalog_year");
CREATE INDEX "academic_journal_sync_state_initial_backfill_complete_last_successful_at_idx"
  ON "academic_journal_sync_state"("initial_backfill_complete", "last_successful_at");
