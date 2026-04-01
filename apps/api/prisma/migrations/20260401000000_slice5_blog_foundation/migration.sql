CREATE TYPE "Locale" AS ENUM ('en', 'th', 'my');

CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL,
    "slug" VARCHAR NOT NULL,
    "banner_image_url" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ,
    "created_by_admin_id" UUID NOT NULL,
    "updated_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_post_translations" (
    "id" UUID NOT NULL,
    "blog_post_id" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" VARCHAR NOT NULL,
    "body" JSONB NOT NULL,
    "excerpt" TEXT,
    "seo_title" VARCHAR,
    "seo_description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts"("published_at");

CREATE UNIQUE INDEX "blog_post_translations_blog_post_id_locale_key"
ON "blog_post_translations"("blog_post_id", "locale");

ALTER TABLE "blog_posts"
ADD CONSTRAINT "blog_posts_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "blog_posts"
ADD CONSTRAINT "blog_posts_updated_by_admin_id_fkey"
FOREIGN KEY ("updated_by_admin_id") REFERENCES "admins"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "blog_post_translations"
ADD CONSTRAINT "blog_post_translations_blog_post_id_fkey"
FOREIGN KEY ("blog_post_id") REFERENCES "blog_posts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
