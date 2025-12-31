-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeatureKey" AS ENUM ('AD_ALLOWED', 'VERIFIED_BADGE', 'FEATURED_LISTING', 'CUSTOM_LINKS', 'PRIORITY_SUPPORT', 'ANALYTICS_DASHBOARD', 'UNLIMITED_PHOTOS');

-- CreateEnum
CREATE TYPE "LimitKey" AS ENUM ('MAX_BRANCHES', 'MAX_PERSONS', 'MAX_ADS', 'MAX_GALLERY_PHOTOS', 'MAX_PRODUCTS');

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "slug" TEXT NOT NULL,
    "description_ar" TEXT,
    "description_en" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_features" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "package_id" UUID NOT NULL,
    "feature_key" "FeatureKey" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "package_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_limits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "package_id" UUID NOT NULL,
    "limit_key" "LimitKey" NOT NULL,
    "limit_value" INTEGER NOT NULL,

    CONSTRAINT "package_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_packages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_package_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "old_package_id" UUID,
    "price" DECIMAL(12,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packages_slug_key" ON "packages"("slug");

-- CreateIndex
CREATE INDEX "packages_status_idx" ON "packages"("status");

-- CreateIndex
CREATE INDEX "packages_is_public_idx" ON "packages"("is_public");

-- CreateIndex
CREATE INDEX "packages_sort_order_idx" ON "packages"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "package_features_package_id_feature_key_key" ON "package_features"("package_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "package_limits_package_id_limit_key_key" ON "package_limits"("package_id", "limit_key");

-- CreateIndex
CREATE UNIQUE INDEX "business_packages_business_id_key" ON "business_packages"("business_id");

-- CreateIndex
CREATE INDEX "business_packages_business_id_idx" ON "business_packages"("business_id");

-- CreateIndex
CREATE INDEX "business_packages_package_id_idx" ON "business_packages"("package_id");

-- CreateIndex
CREATE INDEX "business_packages_is_active_idx" ON "business_packages"("is_active");

-- AddForeignKey
ALTER TABLE "package_features" ADD CONSTRAINT "package_features_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_limits" ADD CONSTRAINT "package_limits_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_packages" ADD CONSTRAINT "business_packages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_packages" ADD CONSTRAINT "business_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_history" ADD CONSTRAINT "package_history_business_package_id_fkey" FOREIGN KEY ("business_package_id") REFERENCES "business_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
