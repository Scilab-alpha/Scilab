-- Add auth sessions for environments that already applied the initial schema
-- before authentication tables were introduced.

CREATE TABLE IF NOT EXISTS "auth_session" (
    "auth_session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token_id_hash" VARCHAR(128) NOT NULL,
    "refresh_token_hash" VARCHAR(128) NOT NULL,
    "issued_at" TIMESTAMP(6) NOT NULL,
    "access_token_expires_at" TIMESTAMP(6) NOT NULL,
    "refresh_token_expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(6),
    "rotated_at" TIMESTAMP(6),

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("auth_session_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_session_access_token_id_hash_key"
    ON "auth_session"("access_token_id_hash");

CREATE UNIQUE INDEX IF NOT EXISTS "auth_session_refresh_token_hash_key"
    ON "auth_session"("refresh_token_hash");

CREATE INDEX IF NOT EXISTS "auth_session_user_id_idx"
    ON "auth_session"("user_id");

CREATE INDEX IF NOT EXISTS "auth_session_access_token_expires_at_idx"
    ON "auth_session"("access_token_expires_at");

CREATE INDEX IF NOT EXISTS "auth_session_refresh_token_expires_at_idx"
    ON "auth_session"("refresh_token_expires_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'auth_session_user_id_fkey'
    ) THEN
        ALTER TABLE "auth_session"
            ADD CONSTRAINT "auth_session_user_id_fkey"
            FOREIGN KEY ("user_id")
            REFERENCES "user"("user_id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;
