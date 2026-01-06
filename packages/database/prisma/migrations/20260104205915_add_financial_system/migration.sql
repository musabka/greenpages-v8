-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('COLLECTED', 'SETTLED', 'VERIFIED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_WALLET');

-- AlterTable
ALTER TABLE "governorate_managers" ADD COLUMN     "company_commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 15;

-- CreateTable
CREATE TABLE "agent_collections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_profile_id" UUID NOT NULL,
    "business_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "receipt_number" TEXT,
    "status" "CollectionStatus" NOT NULL DEFAULT 'COLLECTED',
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "settlement_id" UUID,
    "attachments" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_settlements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_profile_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "collection_ids" UUID[],
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "received_by_user_id" UUID,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "receipt_number" TEXT,
    "attachments" TEXT[],
    "notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_settlements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "governorate_manager_id" UUID NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL,
    "company_commission" DECIMAL(12,2) NOT NULL,
    "company_commission_rate" DECIMAL(5,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "received_by_user_id" UUID,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "receipt_number" TEXT,
    "attachments" TEXT[],
    "notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_profile_id" UUID NOT NULL,
    "base_salary" DECIMAL(10,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "bonus_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deduction_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "approved_by_user_id" UUID,
    "paid_by_user_id" UUID,
    "receipt_number" TEXT,
    "attachments" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_collections_agent_profile_id_idx" ON "agent_collections"("agent_profile_id");

-- CreateIndex
CREATE INDEX "agent_collections_business_id_idx" ON "agent_collections"("business_id");

-- CreateIndex
CREATE INDEX "agent_collections_status_idx" ON "agent_collections"("status");

-- CreateIndex
CREATE INDEX "agent_collections_collected_at_idx" ON "agent_collections"("collected_at");

-- CreateIndex
CREATE INDEX "agent_collections_settlement_id_idx" ON "agent_collections"("settlement_id");

-- CreateIndex
CREATE INDEX "agent_settlements_agent_profile_id_idx" ON "agent_settlements"("agent_profile_id");

-- CreateIndex
CREATE INDEX "agent_settlements_status_idx" ON "agent_settlements"("status");

-- CreateIndex
CREATE INDEX "agent_settlements_requested_at_idx" ON "agent_settlements"("requested_at");

-- CreateIndex
CREATE INDEX "agent_settlements_received_by_user_id_idx" ON "agent_settlements"("received_by_user_id");

-- CreateIndex
CREATE INDEX "manager_settlements_governorate_manager_id_idx" ON "manager_settlements"("governorate_manager_id");

-- CreateIndex
CREATE INDEX "manager_settlements_status_idx" ON "manager_settlements"("status");

-- CreateIndex
CREATE INDEX "manager_settlements_period_start_idx" ON "manager_settlements"("period_start");

-- CreateIndex
CREATE INDEX "manager_settlements_period_end_idx" ON "manager_settlements"("period_end");

-- CreateIndex
CREATE INDEX "manager_settlements_received_by_user_id_idx" ON "manager_settlements"("received_by_user_id");

-- CreateIndex
CREATE INDEX "commission_payments_agent_profile_id_idx" ON "commission_payments"("agent_profile_id");

-- CreateIndex
CREATE INDEX "commission_payments_status_idx" ON "commission_payments"("status");

-- CreateIndex
CREATE INDEX "commission_payments_period_start_idx" ON "commission_payments"("period_start");

-- CreateIndex
CREATE INDEX "commission_payments_period_end_idx" ON "commission_payments"("period_end");

-- CreateIndex
CREATE INDEX "commission_payments_paid_at_idx" ON "commission_payments"("paid_at");

-- AddForeignKey
ALTER TABLE "agent_collections" ADD CONSTRAINT "agent_collections_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_collections" ADD CONSTRAINT "agent_collections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_collections" ADD CONSTRAINT "agent_collections_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "agent_settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_settlements" ADD CONSTRAINT "agent_settlements_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_settlements" ADD CONSTRAINT "agent_settlements_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_settlements" ADD CONSTRAINT "manager_settlements_governorate_manager_id_fkey" FOREIGN KEY ("governorate_manager_id") REFERENCES "governorate_managers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_settlements" ADD CONSTRAINT "manager_settlements_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_paid_by_user_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
