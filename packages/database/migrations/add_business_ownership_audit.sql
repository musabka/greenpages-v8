-- CreateTable: BusinessOwnershipAudit
-- سجل تدقيق تغييرات ملكية الأنشطة التجارية

CREATE TABLE IF NOT EXISTS "business_ownership_audits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT,
    "changes" JSONB,
    "performed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_ownership_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_ownership_audits_business_id_idx" ON "business_ownership_audits"("business_id");
CREATE INDEX "business_ownership_audits_user_id_idx" ON "business_ownership_audits"("user_id");
CREATE INDEX "business_ownership_audits_action_idx" ON "business_ownership_audits"("action");
CREATE INDEX "business_ownership_audits_created_at_idx" ON "business_ownership_audits"("created_at");
CREATE INDEX "business_ownership_audits_performed_by_idx" ON "business_ownership_audits"("performed_by");

-- AddForeignKey
ALTER TABLE "business_ownership_audits" ADD CONSTRAINT "business_ownership_audits_performed_by_fkey" 
    FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comment
COMMENT ON TABLE "business_ownership_audits" IS 'سجل تدقيق تغييرات ملكية الأنشطة التجارية - يتتبع جميع التغييرات في ملكية النشاط التجاري';
COMMENT ON COLUMN "business_ownership_audits"."action" IS 'نوع الإجراء: LINKED, UNLINKED, STATUS_CHANGED, VERIFIED, VERIFICATION_REVOKED';
COMMENT ON COLUMN "business_ownership_audits"."changes" IS 'تفاصيل التغييرات بصيغة JSON';
