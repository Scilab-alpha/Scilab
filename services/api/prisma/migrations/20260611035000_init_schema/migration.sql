-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "status_account" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "role_account" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ranking_metric_type" AS ENUM ('QUARTILE', 'RANK', 'SCORE', 'PERCENTILE');

-- CreateEnum
CREATE TYPE "ranking_source" AS ENUM ('SCIMAGO', 'SCOPUS', 'WOS', 'DOAJ', 'OTHER');

-- CreateEnum
CREATE TYPE "type_zone" AS ENUM ('COUNTRY', 'REGION');

-- CreateEnum
CREATE TYPE "source_zone" AS ENUM ('ISO', 'SCIMAGO', 'SCOPUS', 'OTHER');

-- CreateTable
CREATE TABLE "user" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "type" "auth_provider" NOT NULL,
    "status" "status_account" NOT NULL,
    "role" "role_account" NOT NULL,
    "last_name" VARCHAR(255),
    "first_name" VARCHAR(255),
    "url_image" VARCHAR(2048),
    "date_of_birth" DATE,
    "gender" BOOLEAN,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth_session" (
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

-- CreateTable
CREATE TABLE "publisher" (
    "publisher_id" UUID NOT NULL,
    "display_name" VARCHAR(255),
    "image_url" VARCHAR(2048),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publisher_pkey" PRIMARY KEY ("publisher_id")
);

-- CreateTable
CREATE TABLE "zone" (
    "zone_id" UUID NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(255),
    "type" "type_zone" NOT NULL,
    "iso_code" VARCHAR(50),
    "source" "source_zone" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zone_pkey" PRIMARY KEY ("zone_id")
);

-- CreateTable
CREATE TABLE "journal" (
    "journal_id" UUID NOT NULL,
    "source_id" VARCHAR(255),
    "publisher_id" UUID,
    "country" UUID,
    "region" UUID,
    "display_name" VARCHAR(255),
    "type" VARCHAR(100),
    "is_open_access" BOOLEAN,
    "is_oa_diamond" BOOLEAN,
    "coverage" VARCHAR(255),

    CONSTRAINT "journal_pkey" PRIMARY KEY ("journal_id")
);

-- CreateTable
CREATE TABLE "journal_issn" (
    "journal_issn_id" UUID NOT NULL,
    "journal_id" UUID,
    "issn" VARCHAR(32),

    CONSTRAINT "journal_issn_pkey" PRIMARY KEY ("journal_issn_id")
);

-- CreateTable
CREATE TABLE "subject_area" (
    "subject_area_id" UUID NOT NULL,
    "display_name" VARCHAR(255),
    "description" VARCHAR(1000),

    CONSTRAINT "subject_area_pkey" PRIMARY KEY ("subject_area_id")
);

-- CreateTable
CREATE TABLE "subject_category" (
    "subject_category_id" UUID NOT NULL,
    "subject_area_id" UUID,
    "display_name" VARCHAR(255),
    "description" VARCHAR(1000),

    CONSTRAINT "subject_category_pkey" PRIMARY KEY ("subject_category_id")
);

-- CreateTable
CREATE TABLE "journal_subject_category" (
    "journal_id" UUID NOT NULL,
    "subject_category_id" UUID NOT NULL,

    CONSTRAINT "journal_subject_category_pkey" PRIMARY KEY ("journal_id","subject_category_id")
);

-- CreateTable
CREATE TABLE "ranking_metric" (
    "metric_id" UUID NOT NULL,
    "code" VARCHAR(100),
    "display_name" VARCHAR(255),
    "metric_type" "ranking_metric_type" NOT NULL,
    "description" VARCHAR(1000),

    CONSTRAINT "ranking_metric_pkey" PRIMARY KEY ("metric_id")
);

-- CreateTable
CREATE TABLE "journal_ranking" (
    "journal_ranking_id" UUID NOT NULL,
    "journal_id" UUID NOT NULL,
    "subject_category_id" UUID,
    "source" "ranking_source" NOT NULL,
    "metric_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "value_txt" VARCHAR(255),
    "value_int" INTEGER,
    "value_float" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_ranking_pkey" PRIMARY KEY ("journal_ranking_id")
);

-- CreateTable
CREATE TABLE "volume" (
    "volume_id" UUID NOT NULL,
    "journal_id" UUID,
    "volume_number" INTEGER,
    "publication_year" INTEGER,

    CONSTRAINT "volume_pkey" PRIMARY KEY ("volume_id")
);

-- CreateTable
CREATE TABLE "issue" (
    "issue_id" UUID NOT NULL,
    "volume_id" UUID,
    "issue_number" VARCHAR(100),
    "publication_year" INTEGER,

    CONSTRAINT "issue_pkey" PRIMARY KEY ("issue_id")
);

-- CreateTable
CREATE TABLE "article" (
    "article_id" UUID NOT NULL,
    "version" VARCHAR(100),
    "issue_id" UUID,
    "title" VARCHAR(1000) NOT NULL,
    "abstract" TEXT,
    "publication_year" INTEGER,
    "doi" VARCHAR(255),
    "primary_topic" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "author" (
    "author_id" UUID NOT NULL,
    "orcid" VARCHAR(50),
    "display_name" VARCHAR(255),
    "url_image" VARCHAR(2048),

    CONSTRAINT "author_pkey" PRIMARY KEY ("author_id")
);

-- CreateTable
CREATE TABLE "author_article" (
    "author_id" UUID NOT NULL,
    "article_id" UUID NOT NULL,

    CONSTRAINT "author_article_pkey" PRIMARY KEY ("author_id","article_id")
);

-- CreateTable
CREATE TABLE "keyword" (
    "keyword_id" UUID NOT NULL,
    "display_name" VARCHAR(255),

    CONSTRAINT "keyword_pkey" PRIMARY KEY ("keyword_id")
);

-- CreateTable
CREATE TABLE "keyword_article" (
    "keyword_id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "score" DOUBLE PRECISION,

    CONSTRAINT "keyword_article_pkey" PRIMARY KEY ("keyword_id","article_id")
);

-- CreateTable
CREATE TABLE "topic" (
    "topic_id" UUID NOT NULL,
    "display_name" VARCHAR(255),
    "score" DOUBLE PRECISION,

    CONSTRAINT "topic_pkey" PRIMARY KEY ("topic_id")
);

-- CreateTable
CREATE TABLE "sub_topic" (
    "article_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "sub_topic_pkey" PRIMARY KEY ("article_id","topic_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_access_token_id_hash_key" ON "auth_session"("access_token_id_hash");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_refresh_token_hash_key" ON "auth_session"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "auth_session_user_id_idx" ON "auth_session"("user_id");

-- CreateIndex
CREATE INDEX "auth_session_access_token_expires_at_idx" ON "auth_session"("access_token_expires_at");

-- CreateIndex
CREATE INDEX "auth_session_refresh_token_expires_at_idx" ON "auth_session"("refresh_token_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "zone_code_type_source_key" ON "zone"("code", "type", "source");

-- CreateIndex
CREATE INDEX "journal_publisher_id_idx" ON "journal"("publisher_id");

-- CreateIndex
CREATE INDEX "journal_country_idx" ON "journal"("country");

-- CreateIndex
CREATE INDEX "journal_region_idx" ON "journal"("region");

-- CreateIndex
CREATE INDEX "journal_source_id_idx" ON "journal"("source_id");

-- CreateIndex
CREATE INDEX "journal_issn_journal_id_idx" ON "journal_issn"("journal_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_issn_journal_id_issn_key" ON "journal_issn"("journal_id", "issn");

-- CreateIndex
CREATE INDEX "subject_category_subject_area_id_idx" ON "subject_category"("subject_area_id");

-- CreateIndex
CREATE INDEX "journal_subject_category_subject_category_id_idx" ON "journal_subject_category"("subject_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_metric_code_key" ON "ranking_metric"("code");

-- CreateIndex
CREATE INDEX "journal_ranking_metric_id_idx" ON "journal_ranking"("metric_id");

-- CreateIndex
CREATE INDEX "journal_ranking_subject_category_id_idx" ON "journal_ranking"("subject_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_ranking_journal_id_subject_category_id_source_metri_key" ON "journal_ranking"("journal_id", "subject_category_id", "source", "metric_id", "year");

-- CreateIndex
CREATE INDEX "volume_journal_id_idx" ON "volume"("journal_id");

-- CreateIndex
CREATE UNIQUE INDEX "volume_journal_id_volume_number_publication_year_key" ON "volume"("journal_id", "volume_number", "publication_year");

-- CreateIndex
CREATE INDEX "issue_volume_id_idx" ON "issue"("volume_id");

-- CreateIndex
CREATE UNIQUE INDEX "issue_volume_id_issue_number_publication_year_key" ON "issue"("volume_id", "issue_number", "publication_year");

-- CreateIndex
CREATE INDEX "article_doi_idx" ON "article"("doi");

-- CreateIndex
CREATE INDEX "article_issue_id_idx" ON "article"("issue_id");

-- CreateIndex
CREATE INDEX "article_primary_topic_idx" ON "article"("primary_topic");

-- CreateIndex
CREATE UNIQUE INDEX "author_orcid_key" ON "author"("orcid");

-- CreateIndex
CREATE INDEX "author_article_article_id_idx" ON "author_article"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_display_name_key" ON "keyword"("display_name");

-- CreateIndex
CREATE INDEX "keyword_article_article_id_idx" ON "keyword_article"("article_id");

-- CreateIndex
CREATE INDEX "sub_topic_topic_id_idx" ON "sub_topic"("topic_id");

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal" ADD CONSTRAINT "journal_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publisher"("publisher_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal" ADD CONSTRAINT "journal_country_fkey" FOREIGN KEY ("country") REFERENCES "zone"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal" ADD CONSTRAINT "journal_region_fkey" FOREIGN KEY ("region") REFERENCES "zone"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_issn" ADD CONSTRAINT "journal_issn_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journal"("journal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_category" ADD CONSTRAINT "subject_category_subject_area_id_fkey" FOREIGN KEY ("subject_area_id") REFERENCES "subject_area"("subject_area_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_subject_category" ADD CONSTRAINT "journal_subject_category_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journal"("journal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_subject_category" ADD CONSTRAINT "journal_subject_category_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "subject_category"("subject_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_ranking" ADD CONSTRAINT "journal_ranking_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journal"("journal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_ranking" ADD CONSTRAINT "journal_ranking_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "subject_category"("subject_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_ranking" ADD CONSTRAINT "journal_ranking_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "ranking_metric"("metric_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume" ADD CONSTRAINT "volume_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journal"("journal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "volume"("volume_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issue"("issue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_primary_topic_fkey" FOREIGN KEY ("primary_topic") REFERENCES "topic"("topic_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_article" ADD CONSTRAINT "author_article_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("author_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_article" ADD CONSTRAINT "author_article_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_article" ADD CONSTRAINT "keyword_article_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keyword"("keyword_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_article" ADD CONSTRAINT "keyword_article_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_topic" ADD CONSTRAINT "sub_topic_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_topic" ADD CONSTRAINT "sub_topic_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topic"("topic_id") ON DELETE RESTRICT ON UPDATE CASCADE;
