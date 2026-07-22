-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "status_account" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "role_account" AS ENUM ('STUDENT', 'LECTURER', 'RESEARCHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "follow_object_type" AS ENUM ('JOURNAL', 'KEYWORD', 'TOPIC');

-- CreateEnum
CREATE TYPE "notify_mode" AS ENUM ('IN_APP', 'DAILY_EMAIL', 'WEEKLY_EMAIL', 'OFF');

-- CreateEnum
CREATE TYPE "notification_object_type" AS ENUM ('ARTICLE', 'JOURNAL', 'KEYWORD', 'TOPIC');

-- CreateEnum
CREATE TYPE "sync_frequency" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "sync_source" AS ENUM ('OPENALEX', 'SEMANTIC_SCHOLAR', 'CROSSREF', 'SCIMAGO', 'NEO4J', 'SYSTEM');

-- CreateEnum
CREATE TYPE "sync_job_type" AS ENUM ('SCHEDULED_SYNC', 'MANUAL_SYNC', 'ORPHAN_CLEANUP', 'TREND_AGGREGATION', 'ALERT_DISPATCH');

-- CreateEnum
CREATE TYPE "sync_status" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ranking_metric_type" AS ENUM ('QUARTILE', 'RANK', 'SCORE', 'PERCENTILE');

-- CreateEnum
CREATE TYPE "ranking_source" AS ENUM ('SCIMAGO', 'SCOPUS', 'WOS', 'DOAJ', 'OTHER');

-- CreateTable
CREATE TABLE "user_account" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "type" "auth_provider" NOT NULL,
    "status" "status_account" NOT NULL,
    "role" "role_account" NOT NULL,
    "last_name" VARCHAR(255),
    "first_name" VARCHAR(255),
    "url_image" VARCHAR(2048),
    "date_of_birth" DATE,
    "gender" "gender",
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("user_id")
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
    "last_used_at" TIMESTAMP(6),
    "rotated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("auth_session_id")
);

-- CreateTable
CREATE TABLE "user_bookmark" (
    "user_bookmark_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bookmark_pkey" PRIMARY KEY ("user_bookmark_id")
);

-- CreateTable
CREATE TABLE "user_follow" (
    "user_follow_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "object_type" "follow_object_type" NOT NULL,
    "object_id" UUID NOT NULL,
    "notify_mode" "notify_mode" NOT NULL DEFAULT 'IN_APP',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follow_pkey" PRIMARY KEY ("user_follow_id")
);

-- CreateTable
CREATE TABLE "notification" (
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "related_object_type" "notification_object_type",
    "related_object_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(6),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "config_id" UUID NOT NULL,
    "api_name" VARCHAR(100) NOT NULL,
    "api_endpoint" VARCHAR(2048) NOT NULL,
    "api_key_encrypted" TEXT,
    "sync_frequency" "sync_frequency" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_tested_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "sync_log_id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "source" "sync_source" NOT NULL,
    "job_type" "sync_job_type" NOT NULL,
    "started_at" TIMESTAMP(6) NOT NULL,
    "finished_at" TIMESTAMP(6),
    "total_fetched" INTEGER NOT NULL DEFAULT 0,
    "total_inserted" INTEGER NOT NULL DEFAULT 0,
    "total_updated" INTEGER NOT NULL DEFAULT 0,
    "total_errors" INTEGER NOT NULL DEFAULT 0,
    "orphan_found" INTEGER NOT NULL DEFAULT 0,
    "orphan_processed" INTEGER NOT NULL DEFAULT 0,
    "status" "sync_status" NOT NULL,
    "error_detail" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("sync_log_id")
);

-- CreateTable
CREATE TABLE "subject_area" (
    "subject_area_id" UUID NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),

    CONSTRAINT "subject_area_pkey" PRIMARY KEY ("subject_area_id")
);

-- CreateTable
CREATE TABLE "subject_category" (
    "subject_category_id" UUID NOT NULL,
    "subject_area_id" UUID,
    "display_name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),

    CONSTRAINT "subject_category_pkey" PRIMARY KEY ("subject_category_id")
);

-- CreateTable
CREATE TABLE "ranking_metric" (
    "metric_id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
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
    "metric_id" UUID NOT NULL,
    "source" "ranking_source" NOT NULL,
    "year" INTEGER NOT NULL,
    "value_txt" VARCHAR(255),
    "value_int" INTEGER,
    "value_float" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_ranking_pkey" PRIMARY KEY ("journal_ranking_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE INDEX "user_account_role_idx" ON "user_account"("role");

-- CreateIndex
CREATE INDEX "user_account_status_idx" ON "user_account"("status");

-- CreateIndex
CREATE INDEX "user_account_created_at_idx" ON "user_account"("created_at");

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
CREATE INDEX "user_bookmark_user_id_created_at_idx" ON "user_bookmark"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_bookmark_article_id_idx" ON "user_bookmark"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmark_user_id_article_id_key" ON "user_bookmark"("user_id", "article_id");

-- CreateIndex
CREATE INDEX "user_follow_user_id_created_at_idx" ON "user_follow"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_follow_object_type_object_id_idx" ON "user_follow"("object_type", "object_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_follow_user_id_object_type_object_id_key" ON "user_follow"("user_id", "object_type", "object_id");

-- CreateIndex
CREATE INDEX "notification_user_id_is_read_created_at_idx" ON "notification"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notification_related_object_type_related_object_id_idx" ON "notification"("related_object_type", "related_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_api_name_key" ON "system_config"("api_name");

-- CreateIndex
CREATE INDEX "system_config_is_active_idx" ON "system_config"("is_active");

-- CreateIndex
CREATE INDEX "sync_log_source_started_at_idx" ON "sync_log"("source", "started_at");

-- CreateIndex
CREATE INDEX "sync_log_config_id_started_at_idx" ON "sync_log"("config_id", "started_at");

-- CreateIndex
CREATE INDEX "sync_log_job_type_started_at_idx" ON "sync_log"("job_type", "started_at");

-- CreateIndex
CREATE INDEX "sync_log_status_started_at_idx" ON "sync_log"("status", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "subject_area_display_name_key" ON "subject_area"("display_name");

-- CreateIndex
CREATE INDEX "subject_category_subject_area_id_idx" ON "subject_category"("subject_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_category_subject_area_id_display_name_key" ON "subject_category"("subject_area_id", "display_name");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_metric_code_key" ON "ranking_metric"("code");

-- CreateIndex
CREATE INDEX "journal_ranking_journal_id_year_idx" ON "journal_ranking"("journal_id", "year");

-- CreateIndex
CREATE INDEX "journal_ranking_metric_id_idx" ON "journal_ranking"("metric_id");

-- CreateIndex
CREATE INDEX "journal_ranking_subject_category_id_idx" ON "journal_ranking"("subject_category_id");

-- CreateIndex
CREATE INDEX "journal_ranking_source_year_idx" ON "journal_ranking"("source", "year");

-- CreateIndex
CREATE UNIQUE INDEX "journal_ranking_journal_id_subject_category_id_source_metri_key" ON "journal_ranking"("journal_id", "subject_category_id", "source", "metric_id", "year");

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmark" ADD CONSTRAINT "user_bookmark_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follow" ADD CONSTRAINT "user_follow_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_log" ADD CONSTRAINT "sync_log_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "system_config"("config_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_category" ADD CONSTRAINT "subject_category_subject_area_id_fkey" FOREIGN KEY ("subject_area_id") REFERENCES "subject_area"("subject_area_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_ranking" ADD CONSTRAINT "journal_ranking_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "subject_category"("subject_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_ranking" ADD CONSTRAINT "journal_ranking_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "ranking_metric"("metric_id") ON DELETE RESTRICT ON UPDATE CASCADE;
