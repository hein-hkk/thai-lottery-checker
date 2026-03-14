CREATE TABLE "system_heartbeat" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL DEFAULT 'foundation',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_heartbeat_pkey" PRIMARY KEY ("id")
);
