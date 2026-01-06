-- CreateEnum
CREATE TYPE "BusinessCapabilityRole" AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "CapabilityStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('UNVERIFIED', 'FIELD_VERIFIED', 'OWNER_CONFIRMED', 'DOCUMENT_VERIFIED');

-- CreateEnum
CREATE TYPE "CapabilitySource" AS ENUM ('AGENT', 'ADMIN', 'SELF_CLAIMED', 'INVITATION');

-- AlterEnum
-- Note: Cannot DROP enum value in PostgreSQL, skip this step
-- BUSINESS value will remain in enum but won't be used

-- AlterTable Business
-- إضافة ownerStatus
ALTER TABLE "Business" ADD COLUMN "owner_status" TEXT NOT NULL DEFAULT 'unclaimed';

-- CreateIndex
CREATE INDEX "Business_owner_status_idx" ON "Business"("owner_status");

-- CreateTable UserBusinessCapability
CREATE TABLE "user_business_capabilities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "role" "BusinessCapabilityRole" NOT NULL,
    "status" "CapabilityStatus" NOT NULL DEFAULT 'PENDING',
    "trust_level" "TrustLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "source" "CapabilitySource" NOT NULL,
    "created_by_id" UUID,
    "verified_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "permissions" JSONB DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_business_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable BusinessOwnershipInvitation
CREATE TABLE "business_ownership_invitations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "owner_name" TEXT,
    "claim_token" TEXT NOT NULL,
    "status" "CapabilityStatus" NOT NULL DEFAULT 'PENDING',
    "claimed_by_user_id" UUID,
    "claimed_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_ownership_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_business_capabilities_user_id_business_id_role_key" ON "user_business_capabilities"("user_id", "business_id", "role");

-- CreateIndex
CREATE INDEX "user_business_capabilities_user_id_idx" ON "user_business_capabilities"("user_id");

-- CreateIndex
CREATE INDEX "user_business_capabilities_business_id_idx" ON "user_business_capabilities"("business_id");

-- CreateIndex
CREATE INDEX "user_business_capabilities_status_idx" ON "user_business_capabilities"("status");

-- CreateIndex
CREATE INDEX "user_business_capabilities_role_idx" ON "user_business_capabilities"("role");

-- CreateIndex
CREATE UNIQUE INDEX "business_ownership_invitations_claim_token_key" ON "business_ownership_invitations"("claim_token");

-- CreateIndex
CREATE INDEX "business_ownership_invitations_business_id_idx" ON "business_ownership_invitations"("business_id");

-- CreateIndex
CREATE INDEX "business_ownership_invitations_phone_idx" ON "business_ownership_invitations"("phone");

-- CreateIndex
CREATE INDEX "business_ownership_invitations_claim_token_idx" ON "business_ownership_invitations"("claim_token");

-- CreateIndex
CREATE INDEX "business_ownership_invitations_status_idx" ON "business_ownership_invitations"("status");

-- AddForeignKey
ALTER TABLE "user_business_capabilities" ADD CONSTRAINT "user_business_capabilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_business_capabilities" ADD CONSTRAINT "user_business_capabilities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_business_capabilities" ADD CONSTRAINT "user_business_capabilities_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_ownership_invitations" ADD CONSTRAINT "business_ownership_invitations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_ownership_invitations" ADD CONSTRAINT "business_ownership_invitations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_ownership_invitations" ADD CONSTRAINT "business_ownership_invitations_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- تحويل البيانات الموجودة
-- تحويل المستخدمين الذين لديهم ownerId إلى capabilities
INSERT INTO "user_business_capabilities" (
    "user_id",
    "business_id",
    "role",
    "status",
    "trust_level",
    "source",
    "activated_at",
    "created_at",
    "updated_at"
)
SELECT 
    b."owner_id",
    b."id",
    'OWNER'::"BusinessCapabilityRole",
    'ACTIVE'::"CapabilityStatus",
    'FIELD_VERIFIED'::"TrustLevel",
    'AGENT'::"CapabilitySource",
    NOW(),
    b."created_at",
    NOW()
FROM "Business" b
WHERE b."owner_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- تحديث ownerStatus للأنشطة التي لديها مالك
UPDATE "Business"
SET "owner_status" = 'claimed'
WHERE "owner_id" IS NOT NULL;
