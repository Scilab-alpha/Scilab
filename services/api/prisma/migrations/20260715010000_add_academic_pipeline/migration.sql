ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'SCIMAGO_RELOAD';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'ARTICLE_SYNC';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'REFERENCE_HYDRATION';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'INCOMING_CITATION_CRAWL';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'CITATION_COUNT_REFRESH';

CREATE TABLE "academic_sync_checkpoint" (
  "checkpoint_key" VARCHAR(100) NOT NULL,
  "cursor" TEXT,
  "initial_backfill_complete" BOOLEAN NOT NULL DEFAULT false,
  "last_successful_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "academic_sync_checkpoint_pkey" PRIMARY KEY ("checkpoint_key")
);
