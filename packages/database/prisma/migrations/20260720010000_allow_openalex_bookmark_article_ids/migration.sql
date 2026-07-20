ALTER TABLE "user_bookmark"
  ALTER COLUMN "article_id" TYPE VARCHAR(128)
  USING "article_id"::text;
