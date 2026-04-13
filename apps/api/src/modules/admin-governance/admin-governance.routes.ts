import { Router, type Router as ExpressRouter } from "express";
import {
  createAdminWriteRateLimit,
  createInvitationAcceptRateLimit,
  createPasswordResetConfirmRateLimit,
  createPasswordResetRequestRateLimit,
  requireAllowedAdminOrigin
} from "../../security/http.js";
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
const adminWriteRateLimit = createAdminWriteRateLimit();
const invitationAcceptRateLimit = createInvitationAcceptRateLimit();
const passwordResetRequestRateLimit = createPasswordResetRequestRateLimit();
const passwordResetConfirmRateLimit = createPasswordResetConfirmRateLimit();

adminGovernanceRouter.use(requireAllowedAdminOrigin);
adminGovernanceRouter.post("/invitations", requireAdminAuth, adminWriteRateLimit, createInvitation);
adminGovernanceRouter.post("/invitations/accept", invitationAcceptRateLimit, acceptInvitation);
adminGovernanceRouter.post("/invitations/revoke", requireAdminAuth, adminWriteRateLimit, revokeInvitation);
adminGovernanceRouter.post("/password-resets/request", passwordResetRequestRateLimit, requestPasswordReset);
adminGovernanceRouter.post("/password-resets/confirm", passwordResetConfirmRateLimit, confirmPasswordReset);
adminGovernanceRouter.get("/admins", requireAdminAuth, listAdmins);
adminGovernanceRouter.patch("/admins/:id", requireAdminAuth, adminWriteRateLimit, updateAdmin);
