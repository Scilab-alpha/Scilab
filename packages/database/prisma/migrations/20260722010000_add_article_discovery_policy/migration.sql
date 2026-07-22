ALTER TABLE "academic_journal_sync_state"
  ADD COLUMN IF NOT EXISTS "article_discovery_policy_signature" VARCHAR(128);
