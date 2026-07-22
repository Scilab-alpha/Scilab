ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'SEMANTIC_SCHOLAR_JOURNAL_SUPPLEMENT';

DO $$ BEGIN
  CREATE TYPE "semantic_scholar_supplement_status" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'COMPLETED_WITH_SHORTFALL',
    'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "academic_journal_sync_state"
  ADD COLUMN IF NOT EXISTS "semantic_scholar_status" "semantic_scholar_supplement_status" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "semantic_scholar_new_token" TEXT,
  ADD COLUMN IF NOT EXISTS "semantic_scholar_new_accepted" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "semantic_scholar_related_accepted" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "semantic_scholar_processed_seed_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "semantic_scholar_started_at" TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS "semantic_scholar_completed_at" TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS "semantic_scholar_error_detail" TEXT;

CREATE INDEX IF NOT EXISTS "academic_journal_sync_state_semantic_scholar_status_catalog_year_idx"
  ON "academic_journal_sync_state"("semantic_scholar_status", "catalog_year");
