-- CreateIndex
CREATE INDEX "blog_posts_updated_at_id_idx" ON "blog_posts"("updated_at", "id");

-- CreateIndex
CREATE INDEX "blog_posts_status_updated_at_id_idx" ON "blog_posts"("status", "updated_at", "id");
