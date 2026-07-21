ALTER TABLE "user_follow"
ALTER COLUMN "object_id" TYPE VARCHAR(128)
USING "object_id"::text;
