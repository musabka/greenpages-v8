-- CreateIndex
CREATE INDEX "activity_logs_entity_entity_id_idx" ON "activity_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "business_branches_district_id_idx" ON "business_branches"("district_id");

-- CreateIndex
CREATE INDEX "business_branches_is_active_idx" ON "business_branches"("is_active");

-- CreateIndex
CREATE INDEX "business_branches_sort_order_idx" ON "business_branches"("sort_order");

-- CreateIndex
CREATE INDEX "business_categories_business_id_idx" ON "business_categories"("business_id");

-- CreateIndex
CREATE INDEX "business_categories_category_id_idx" ON "business_categories"("category_id");

-- CreateIndex
CREATE INDEX "business_categories_is_primary_idx" ON "business_categories"("is_primary");

-- CreateIndex
CREATE INDEX "business_categories_created_at_idx" ON "business_categories"("created_at");

-- CreateIndex
CREATE INDEX "business_persons_sort_order_idx" ON "business_persons"("sort_order");

-- CreateIndex
CREATE INDEX "businesses_status_governorate_id_idx" ON "businesses"("status", "governorate_id");

-- CreateIndex
CREATE INDEX "businesses_status_city_id_idx" ON "businesses"("status", "city_id");

-- CreateIndex
CREATE INDEX "businesses_status_is_featured_idx" ON "businesses"("status", "is_featured");

-- CreateIndex
CREATE INDEX "businesses_status_is_verified_idx" ON "businesses"("status", "is_verified");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE INDEX "cities_sort_order_idx" ON "cities"("sort_order");

-- CreateIndex
CREATE INDEX "districts_sort_order_idx" ON "districts"("sort_order");

-- CreateIndex
CREATE INDEX "governorates_sort_order_idx" ON "governorates"("sort_order");
