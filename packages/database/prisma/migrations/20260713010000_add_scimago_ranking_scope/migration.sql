ALTER TABLE "journal_ranking"
ADD COLUMN "scope_key" VARCHAR(64);

UPDATE "journal_ranking"
SET "scope_key" = CASE
  WHEN "subject_category_id" IS NULL THEN 'GLOBAL'
  ELSE 'CATEGORY:' || "subject_category_id"::text
END;

ALTER TABLE "journal_ranking"
ALTER COLUMN "scope_key" SET NOT NULL;

ALTER TABLE "journal_ranking"
ALTER COLUMN "journal_id" TYPE VARCHAR(255)
USING "journal_id"::text;

DROP INDEX "subject_category_subject_area_id_display_name_key";
CREATE UNIQUE INDEX "subject_category_display_name_key"
ON "subject_category"("display_name");

DROP INDEX "journal_ranking_journal_id_subject_category_id_source_metri_key";
CREATE UNIQUE INDEX "journal_ranking_journal_id_scope_key_source_metric_id_year_key"
ON "journal_ranking"("journal_id", "scope_key", "source", "metric_id", "year");
