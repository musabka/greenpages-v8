/*
  Warnings:

  - The values [CUSTOM_LINKS,UNLIMITED_PHOTOS] on the enum `FeatureKey` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FeatureKey_new" AS ENUM ('AD_ALLOWED', 'VERIFIED_BADGE', 'FEATURED_LISTING', 'PRIORITY_SUPPORT', 'ANALYTICS_DASHBOARD', 'SHOW_DESCRIPTION', 'SHOW_GALLERY', 'SHOW_TEAM', 'SHOW_PRODUCTS', 'SHOW_BRANCHES', 'SHOW_WORKING_HOURS', 'SHOW_REVIEWS', 'SHOW_PHONE', 'SHOW_WHATSAPP', 'SHOW_EMAIL', 'SHOW_WEBSITE', 'SHOW_SOCIAL_LINKS', 'SHOW_MAP', 'SHOW_ADDRESS');
ALTER TABLE "package_features" ALTER COLUMN "feature_key" TYPE "FeatureKey_new" USING ("feature_key"::text::"FeatureKey_new");
ALTER TYPE "FeatureKey" RENAME TO "FeatureKey_old";
ALTER TYPE "FeatureKey_new" RENAME TO "FeatureKey";
DROP TYPE "FeatureKey_old";
COMMIT;
