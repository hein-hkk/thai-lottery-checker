CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions"("admin_id");
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");
CREATE INDEX "admin_sessions_revoked_at_idx" ON "admin_sessions"("revoked_at");

ALTER TABLE "admin_sessions"
ADD CONSTRAINT "admin_sessions_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "admins"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
