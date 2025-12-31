-- AlterTable
ALTER TABLE "business_packages" ADD COLUMN     "override_by_user_id" UUID,
ADD COLUMN     "override_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "override_expires_at" TIMESTAMP(3),
ADD COLUMN     "override_reason" TEXT;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "business_packages_override_enabled_idx" ON "business_packages"("override_enabled");

-- CreateIndex
CREATE INDEX "packages_is_default_idx" ON "packages"("is_default");
