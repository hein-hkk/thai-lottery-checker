CREATE TYPE "AdminPermission" AS ENUM ('manage_results', 'manage_blogs');

ALTER TABLE "admins"
ADD COLUMN "name" TEXT,
ADD COLUMN "password_updated_at" TIMESTAMP(3),
ADD COLUMN "deactivated_at" TIMESTAMP(3),
ADD COLUMN "invited_by_admin_id" UUID;

CREATE TABLE "admin_permissions" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "permission" "AdminPermission" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_invitations" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "permissions_json" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "invited_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_password_resets" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_password_resets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_permissions_admin_id_permission_key"
ON "admin_permissions"("admin_id", "permission");

ALTER TABLE "admins"
ADD CONSTRAINT "admins_invited_by_admin_id_fkey"
FOREIGN KEY ("invited_by_admin_id") REFERENCES "admins"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_permissions"
ADD CONSTRAINT "admin_permissions_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "admins"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_invitations"
ADD CONSTRAINT "admin_invitations_invited_by_admin_id_fkey"
FOREIGN KEY ("invited_by_admin_id") REFERENCES "admins"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "admin_password_resets"
ADD CONSTRAINT "admin_password_resets_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "admins"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs"
ADD CONSTRAINT "admin_audit_logs_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "admins"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
