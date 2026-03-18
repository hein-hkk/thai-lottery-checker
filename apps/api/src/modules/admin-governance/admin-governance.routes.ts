import { Router, type Router as ExpressRouter } from "express";
import { requireAdminAuth } from "../admin-auth/admin-auth.middleware.js";
import {
  acceptInvitation,
  confirmPasswordReset,
  createInvitation,
  listAdmins,
  requestPasswordReset,
  revokeInvitation,
  updateAdmin
} from "./admin-governance.controller.js";

export const adminGovernanceRouter: ExpressRouter = Router();

adminGovernanceRouter.post("/invitations", requireAdminAuth, createInvitation);
adminGovernanceRouter.post("/invitations/accept", acceptInvitation);
adminGovernanceRouter.post("/invitations/revoke", requireAdminAuth, revokeInvitation);
adminGovernanceRouter.post("/password-resets/request", requestPasswordReset);
adminGovernanceRouter.post("/password-resets/confirm", confirmPasswordReset);
adminGovernanceRouter.get("/admins", requireAdminAuth, listAdmins);
adminGovernanceRouter.patch("/admins/:id", requireAdminAuth, updateAdmin);
