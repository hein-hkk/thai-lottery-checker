CREATE TYPE "PublishStatus" AS ENUM ('draft', 'published');
CREATE TYPE "PrizeType" AS ENUM (
    'FIRST_PRIZE',
    'NEAR_FIRST_PRIZE',
    'SECOND_PRIZE',
    'THIRD_PRIZE',
    'FOURTH_PRIZE',
    'FIFTH_PRIZE',
    'FRONT_THREE',
    'LAST_THREE',
    'LAST_TWO'
);
CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'editor');

CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'editor',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lottery_draws" (
    "id" UUID NOT NULL,
    "draw_date" DATE NOT NULL,
    "draw_code" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_by_admin_id" UUID NOT NULL,
    "updated_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lottery_draws_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lottery_results" (
    "id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "prize_type" "PrizeType" NOT NULL,
    "prize_index" INTEGER NOT NULL DEFAULT 0,
    "number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lottery_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
CREATE UNIQUE INDEX "lottery_draws_draw_date_key" ON "lottery_draws"("draw_date");
CREATE INDEX "lottery_draws_status_idx" ON "lottery_draws"("status");
CREATE INDEX "lottery_draws_published_at_idx" ON "lottery_draws"("published_at");
CREATE INDEX "lottery_results_draw_id_idx" ON "lottery_results"("draw_id");
CREATE INDEX "lottery_results_draw_id_prize_type_idx" ON "lottery_results"("draw_id", "prize_type");
CREATE UNIQUE INDEX "lottery_results_draw_id_prize_type_prize_index_key"
ON "lottery_results"("draw_id", "prize_type", "prize_index");

ALTER TABLE "lottery_draws"
ADD CONSTRAINT "lottery_draws_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lottery_draws"
ADD CONSTRAINT "lottery_draws_updated_by_admin_id_fkey"
FOREIGN KEY ("updated_by_admin_id") REFERENCES "admins"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lottery_results"
ADD CONSTRAINT "lottery_results_draw_id_fkey"
FOREIGN KEY ("draw_id") REFERENCES "lottery_draws"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
