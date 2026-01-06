-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('PENDING', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'RENEWED', 'DECLINED', 'POSTPONED', 'NO_RESPONSE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('PHONE_CALL', 'WHATSAPP', 'VISIT', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "RenewalDecision" AS ENUM ('ACCEPTED', 'DECLINED', 'THINKING', 'UPGRADE', 'DOWNGRADE');

-- CreateTable
CREATE TABLE "renewal_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "business_package_id" UUID NOT NULL,
    "current_package_id" UUID NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "status" "RenewalStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assigned_agent_id" UUID,
    "assigned_at" TIMESTAMP(3),
    "final_decision" "RenewalDecision",
    "decision_date" TIMESTAMP(3),
    "decision_notes" TEXT,
    "new_package_id" UUID,
    "next_follow_up_date" TIMESTAMP(3),
    "follow_up_count" INTEGER NOT NULL DEFAULT 0,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renewal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewal_contacts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "renewal_record_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "contact_method" "ContactMethod" NOT NULL,
    "contact_date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "outcome" "RenewalDecision",
    "notes" TEXT,
    "visit_address" TEXT,
    "visit_latitude" DECIMAL(10,8),
    "visit_longitude" DECIMAL(11,8),
    "next_contact_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renewal_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "renewal_records_business_id_idx" ON "renewal_records"("business_id");

-- CreateIndex
CREATE INDEX "renewal_records_status_idx" ON "renewal_records"("status");

-- CreateIndex
CREATE INDEX "renewal_records_assigned_agent_id_idx" ON "renewal_records"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "renewal_records_expiry_date_idx" ON "renewal_records"("expiry_date");

-- CreateIndex
CREATE INDEX "renewal_records_priority_idx" ON "renewal_records"("priority");

-- CreateIndex
CREATE INDEX "renewal_records_next_follow_up_date_idx" ON "renewal_records"("next_follow_up_date");

-- CreateIndex
CREATE INDEX "renewal_records_status_assigned_agent_id_idx" ON "renewal_records"("status", "assigned_agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "renewal_records_business_id_expiry_date_key" ON "renewal_records"("business_id", "expiry_date");

-- CreateIndex
CREATE INDEX "renewal_contacts_renewal_record_id_idx" ON "renewal_contacts"("renewal_record_id");

-- CreateIndex
CREATE INDEX "renewal_contacts_agent_id_idx" ON "renewal_contacts"("agent_id");

-- CreateIndex
CREATE INDEX "renewal_contacts_contact_date_idx" ON "renewal_contacts"("contact_date");

-- CreateIndex
CREATE INDEX "renewal_contacts_contact_method_idx" ON "renewal_contacts"("contact_method");

-- AddForeignKey
ALTER TABLE "renewal_records" ADD CONSTRAINT "renewal_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_records" ADD CONSTRAINT "renewal_records_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_records" ADD CONSTRAINT "renewal_records_current_package_id_fkey" FOREIGN KEY ("current_package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_records" ADD CONSTRAINT "renewal_records_new_package_id_fkey" FOREIGN KEY ("new_package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_contacts" ADD CONSTRAINT "renewal_contacts_renewal_record_id_fkey" FOREIGN KEY ("renewal_record_id") REFERENCES "renewal_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_contacts" ADD CONSTRAINT "renewal_contacts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
