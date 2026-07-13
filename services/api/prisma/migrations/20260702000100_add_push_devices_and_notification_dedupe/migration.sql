-- CreateEnum
CREATE TYPE "push_provider" AS ENUM ('EXPO', 'FCM');

-- CreateEnum
CREATE TYPE "push_platform" AS ENUM ('IOS', 'ANDROID', 'WEB', 'UNKNOWN');

-- CreateTable
CREATE TABLE "user_push_device" (
    "push_device_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "push_provider" NOT NULL,
    "token" VARCHAR(2048) NOT NULL,
    "platform" "push_platform" NOT NULL DEFAULT 'UNKNOWN',
    "client_device_id" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_registered_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_push_device_pkey" PRIMARY KEY ("push_device_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_user_id_related_object_type_related_object_id_key"
ON "notification"("user_id", "related_object_type", "related_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_push_device_user_id_provider_token_key"
ON "user_push_device"("user_id", "provider", "token");

-- CreateIndex
CREATE INDEX "user_push_device_user_id_is_active_idx"
ON "user_push_device"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_push_device_provider_is_active_idx"
ON "user_push_device"("provider", "is_active");

-- AddForeignKey
ALTER TABLE "user_push_device"
ADD CONSTRAINT "user_push_device_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user_account"("user_id")
ON DELETE CASCADE ON UPDATE CASCADE;
