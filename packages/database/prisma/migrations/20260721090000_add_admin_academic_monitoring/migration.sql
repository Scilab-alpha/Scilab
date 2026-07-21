ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'RELATED_WORK_SYNC';
ALTER TYPE "sync_job_type" ADD VALUE IF NOT EXISTS 'RELATED_WORK_HYDRATION';
ALTER TYPE "sync_status" ADD VALUE IF NOT EXISTS 'CANCELLED';

DO $$ BEGIN
  CREATE TYPE "academic_job_run_trigger" AS ENUM ('CRON', 'MANUAL', 'RETRY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "academic_job_run_status" AS ENUM ('WAITING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "academic_job_audit_action" AS ENUM ('PAUSE', 'RESUME', 'TRIGGER', 'CANCEL', 'RETRY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "academic_job_audit_outcome" AS ENUM ('PENDING', 'SUCCESS', 'REJECTED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "sync_log"
  ADD COLUMN IF NOT EXISTS "job_run_id" UUID,
  ADD COLUMN IF NOT EXISTS "success_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "failure_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "metrics" JSONB;

CREATE TABLE IF NOT EXISTS "academic_job_control" (
  "job_id" VARCHAR(100) NOT NULL,
  "is_paused" BOOLEAN NOT NULL DEFAULT false,
  "paused_at" TIMESTAMP(6),
  "paused_by_user_id" UUID,
  "paused_by_email" VARCHAR(255),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "academic_job_control_pkey" PRIMARY KEY ("job_id")
);

CREATE TABLE IF NOT EXISTS "academic_job_run" (
  "job_run_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "job_id" VARCHAR(100) NOT NULL,
  "bull_job_id" VARCHAR(255),
  "trigger" "academic_job_run_trigger" NOT NULL,
  "status" "academic_job_run_status" NOT NULL DEFAULT 'WAITING',
  "scheduled_at" TIMESTAMP(6) NOT NULL,
  "queued_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(6),
  "finished_at" TIMESTAMP(6),
  "progress_current" INTEGER NOT NULL DEFAULT 0,
  "progress_total" INTEGER,
  "progress_message" VARCHAR(500),
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "error_detail" TEXT,
  "cancellation_requested_at" TIMESTAMP(6),
  "retried_from_run_id" UUID,
  "created_by_admin_id" UUID,
  "created_by_admin_email" VARCHAR(255),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "academic_job_run_pkey" PRIMARY KEY ("job_run_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "academic_job_run_bull_job_id_key"
  ON "academic_job_run"("bull_job_id");
CREATE INDEX IF NOT EXISTS "academic_job_run_job_id_status_queued_at_idx"
  ON "academic_job_run"("job_id", "status", "queued_at");
CREATE INDEX IF NOT EXISTS "academic_job_run_job_id_started_at_idx"
  ON "academic_job_run"("job_id", "started_at");
CREATE INDEX IF NOT EXISTS "academic_job_run_retried_from_run_id_idx"
  ON "academic_job_run"("retried_from_run_id");

CREATE TABLE IF NOT EXISTS "academic_job_audit" (
  "job_audit_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "job_id" VARCHAR(100) NOT NULL,
  "job_run_id" UUID,
  "admin_user_id" UUID NOT NULL,
  "admin_email" VARCHAR(255) NOT NULL,
  "action" "academic_job_audit_action" NOT NULL,
  "outcome" "academic_job_audit_outcome" NOT NULL DEFAULT 'PENDING',
  "reason" VARCHAR(500),
  "error_detail" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(6),
  CONSTRAINT "academic_job_audit_pkey" PRIMARY KEY ("job_audit_id")
);

CREATE INDEX IF NOT EXISTS "academic_job_audit_job_id_created_at_idx"
  ON "academic_job_audit"("job_id", "created_at");
CREATE INDEX IF NOT EXISTS "academic_job_audit_admin_user_id_created_at_idx"
  ON "academic_job_audit"("admin_user_id", "created_at");

CREATE INDEX IF NOT EXISTS "sync_log_job_run_id_idx" ON "sync_log"("job_run_id");
ALTER TABLE "sync_log"
  ADD CONSTRAINT "sync_log_job_run_id_fkey"
  FOREIGN KEY ("job_run_id") REFERENCES "academic_job_run"("job_run_id")
  ON DELETE SET NULL ON UPDATE CASCADE;
