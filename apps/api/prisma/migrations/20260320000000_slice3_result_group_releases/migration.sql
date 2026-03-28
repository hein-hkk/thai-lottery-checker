CREATE TABLE "lottery_result_group_releases" (
  "id" UUID NOT NULL,
  "draw_id" UUID NOT NULL,
  "prize_type" "PrizeType" NOT NULL,
  "is_released" BOOLEAN NOT NULL DEFAULT false,
  "released_at" TIMESTAMPTZ,
  "released_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lottery_result_group_releases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lottery_result_group_releases_draw_id_fkey"
    FOREIGN KEY ("draw_id") REFERENCES "lottery_draws"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "lottery_result_group_releases_released_by_admin_id_fkey"
    FOREIGN KEY ("released_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "lottery_result_group_releases_draw_id_prize_type_key"
  ON "lottery_result_group_releases"("draw_id", "prize_type");

CREATE INDEX "lottery_result_group_releases_draw_id_idx"
  ON "lottery_result_group_releases"("draw_id");

CREATE INDEX "lottery_result_group_releases_draw_id_is_released_idx"
  ON "lottery_result_group_releases"("draw_id", "is_released");
