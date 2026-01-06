/*
  Warnings:

  - Added the required column `updated_at` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "BulkNotificationStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SECURITY';
ALTER TYPE "NotificationType" ADD VALUE 'WELCOME';
ALTER TYPE "NotificationType" ADD VALUE 'PROFILE_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'BUSINESS_PENDING';
ALTER TYPE "NotificationType" ADD VALUE 'BUSINESS_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'BUSINESS_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'BUSINESS_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE 'BUSINESS_REPORT';
ALTER TYPE "NotificationType" ADD VALUE 'BUSINESS_UPDATE_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_RENEWED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_UPGRADED';
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_NEW';
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_PENDING';
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'AD_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'AD_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'AD_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_TASK';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_PERFORMANCE';
ALTER TYPE "NotificationType" ADD VALUE 'RENEWAL_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'RENEWAL_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'RENEWAL_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'PROMOTIONAL';
ALTER TYPE "NotificationType" ADD VALUE 'TARGETED';

-- DropIndex
DROP INDEX "notifications_created_at_idx";

-- DropIndex
DROP INDEX "notifications_is_read_idx";

-- DropIndex
DROP INDEX "notifications_type_idx";

-- DropIndex
DROP INDEX "notifications_user_id_idx";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "action_url" TEXT,
ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "bulk_notification_id" UUID,
ADD COLUMN     "channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "reference_id" UUID,
ADD COLUMN     "reference_type" TEXT,
ADD COLUMN     "scheduled_at" TIMESTAMP(3),
ADD COLUMN     "sender_id" UUID,
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "sent_via_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sent_via_push" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sent_via_sms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profession" TEXT;

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "type_preferences" JSONB,
    "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT,
    "message_ar" TEXT NOT NULL,
    "message_en" TEXT,
    "channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
    "email_subject_ar" TEXT,
    "email_subject_en" TEXT,
    "email_body_ar" TEXT,
    "email_body_en" TEXT,
    "sms_template_ar" TEXT,
    "sms_template_en" TEXT,
    "push_title_ar" TEXT,
    "push_title_en" TEXT,
    "push_body_ar" TEXT,
    "push_body_en" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT,
    "message_ar" TEXT NOT NULL,
    "message_en" TEXT,
    "action_url" TEXT,
    "image_url" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
    "target_criteria" JSONB NOT NULL,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "status" "BulkNotificationStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "device_token" TEXT NOT NULL,
    "device_name" TEXT,
    "device_model" TEXT,
    "os_version" TEXT,
    "app_version" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "job_type" TEXT NOT NULL,
    "job_data" JSONB NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "executed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_code_idx" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "notification_templates"("type");

-- CreateIndex
CREATE INDEX "notification_templates_is_active_idx" ON "notification_templates"("is_active");

-- CreateIndex
CREATE INDEX "bulk_notifications_status_idx" ON "bulk_notifications"("status");

-- CreateIndex
CREATE INDEX "bulk_notifications_scheduled_at_idx" ON "bulk_notifications"("scheduled_at");

-- CreateIndex
CREATE INDEX "bulk_notifications_created_by_id_idx" ON "bulk_notifications"("created_by_id");

-- CreateIndex
CREATE INDEX "user_devices_user_id_is_active_idx" ON "user_devices"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_devices_device_token_idx" ON "user_devices"("device_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_token_key" ON "user_devices"("user_id", "device_token");

-- CreateIndex
CREATE INDEX "scheduled_notifications_scheduled_for_status_idx" ON "scheduled_notifications"("scheduled_for", "status");

-- CreateIndex
CREATE INDEX "scheduled_notifications_job_type_idx" ON "scheduled_notifications"("job_type");

-- CreateIndex
CREATE INDEX "scheduled_notifications_reference_type_reference_id_idx" ON "scheduled_notifications"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_type_idx" ON "notifications"("user_id", "type");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "notifications"("scheduled_at");

-- CreateIndex
CREATE INDEX "notifications_reference_type_reference_id_idx" ON "notifications"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "notifications_bulk_notification_id_idx" ON "notifications"("bulk_notification_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_bulk_notification_id_fkey" FOREIGN KEY ("bulk_notification_id") REFERENCES "bulk_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_notifications" ADD CONSTRAINT "bulk_notifications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
