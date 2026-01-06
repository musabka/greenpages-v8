-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('NEW_SUBSCRIPTION', 'RENEWAL', 'UPGRADE');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "VisitPurpose" AS ENUM ('NEW_REGISTRATION', 'RENEWAL', 'UPDATE_DATA', 'COMPLAINT', 'SUPPORT', 'VERIFICATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPERVISOR';
ALTER TYPE "UserRole" ADD VALUE 'GOVERNORATE_MANAGER';

-- CreateTable
CREATE TABLE "governorate_managers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "governorate_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governorate_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "manager_id" UUID,
    "base_salary" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "total_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_commissions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_businesses" INTEGER NOT NULL DEFAULT 0,
    "total_renewals" INTEGER NOT NULL DEFAULT 0,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_governorates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_profile_id" UUID NOT NULL,
    "governorate_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_governorates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_commissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_profile_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "subscription_amount" DECIMAL(10,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "type" "CommissionType" NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "agent_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_visits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_profile_id" UUID NOT NULL,
    "business_id" UUID,
    "purpose" "VisitPurpose" NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PLANNED',
    "governorate_id" UUID NOT NULL,
    "city_id" UUID,
    "address" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "outcome" TEXT,
    "photos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "governorate_managers_user_id_idx" ON "governorate_managers"("user_id");

-- CreateIndex
CREATE INDEX "governorate_managers_governorate_id_idx" ON "governorate_managers"("governorate_id");

-- CreateIndex
CREATE INDEX "governorate_managers_is_active_idx" ON "governorate_managers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "governorate_managers_user_id_governorate_id_key" ON "governorate_managers"("user_id", "governorate_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_user_id_key" ON "agent_profiles"("user_id");

-- CreateIndex
CREATE INDEX "agent_profiles_user_id_idx" ON "agent_profiles"("user_id");

-- CreateIndex
CREATE INDEX "agent_profiles_manager_id_idx" ON "agent_profiles"("manager_id");

-- CreateIndex
CREATE INDEX "agent_profiles_is_active_idx" ON "agent_profiles"("is_active");

-- CreateIndex
CREATE INDEX "agent_governorates_agent_profile_id_idx" ON "agent_governorates"("agent_profile_id");

-- CreateIndex
CREATE INDEX "agent_governorates_governorate_id_idx" ON "agent_governorates"("governorate_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_governorates_agent_profile_id_governorate_id_key" ON "agent_governorates"("agent_profile_id", "governorate_id");

-- CreateIndex
CREATE INDEX "agent_commissions_agent_profile_id_idx" ON "agent_commissions"("agent_profile_id");

-- CreateIndex
CREATE INDEX "agent_commissions_business_id_idx" ON "agent_commissions"("business_id");

-- CreateIndex
CREATE INDEX "agent_commissions_status_idx" ON "agent_commissions"("status");

-- CreateIndex
CREATE INDEX "agent_commissions_type_idx" ON "agent_commissions"("type");

-- CreateIndex
CREATE INDEX "agent_commissions_created_at_idx" ON "agent_commissions"("created_at");

-- CreateIndex
CREATE INDEX "agent_visits_agent_profile_id_idx" ON "agent_visits"("agent_profile_id");

-- CreateIndex
CREATE INDEX "agent_visits_business_id_idx" ON "agent_visits"("business_id");

-- CreateIndex
CREATE INDEX "agent_visits_status_idx" ON "agent_visits"("status");

-- CreateIndex
CREATE INDEX "agent_visits_purpose_idx" ON "agent_visits"("purpose");

-- CreateIndex
CREATE INDEX "agent_visits_scheduled_at_idx" ON "agent_visits"("scheduled_at");

-- CreateIndex
CREATE INDEX "agent_visits_governorate_id_idx" ON "agent_visits"("governorate_id");

-- AddForeignKey
ALTER TABLE "governorate_managers" ADD CONSTRAINT "governorate_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governorate_managers" ADD CONSTRAINT "governorate_managers_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_governorates" ADD CONSTRAINT "agent_governorates_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_governorates" ADD CONSTRAINT "agent_governorates_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_visits" ADD CONSTRAINT "agent_visits_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_visits" ADD CONSTRAINT "agent_visits_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_visits" ADD CONSTRAINT "agent_visits_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_visits" ADD CONSTRAINT "agent_visits_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
