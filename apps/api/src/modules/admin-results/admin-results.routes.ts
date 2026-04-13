import { Router, type Router as ExpressRouter } from "express";
import { createAdminWriteRateLimit, requireAllowedAdminOrigin } from "../../security/http.js";
import { requireAdminAuth } from "../admin-auth/admin-auth.middleware.js";
import {
  correctAdminPublishedResult,
  createAdminResultDraft,
  getAdminResultDetail,
  listAdminResults,
  publishAdminResultDraft,
  releaseAdminResultGroup,
  unreleaseAdminResultGroup,
  updateAdminResultDraft
} from "./admin-results.controller.js";

export const adminResultsRouter: ExpressRouter = Router();
const adminWriteRateLimit = createAdminWriteRateLimit();

adminResultsRouter.use(requireAllowedAdminOrigin);
adminResultsRouter.get("/results", requireAdminAuth, listAdminResults);
adminResultsRouter.get("/results/:id", requireAdminAuth, getAdminResultDetail);
adminResultsRouter.post("/results", requireAdminAuth, adminWriteRateLimit, createAdminResultDraft);
adminResultsRouter.patch("/results/:id", requireAdminAuth, adminWriteRateLimit, updateAdminResultDraft);
adminResultsRouter.post("/results/:id/prize-groups/:prizeType/release", requireAdminAuth, adminWriteRateLimit, releaseAdminResultGroup);
adminResultsRouter.post("/results/:id/prize-groups/:prizeType/unrelease", requireAdminAuth, adminWriteRateLimit, unreleaseAdminResultGroup);
adminResultsRouter.post("/results/:id/publish", requireAdminAuth, adminWriteRateLimit, publishAdminResultDraft);
adminResultsRouter.patch("/results/:id/correct", requireAdminAuth, adminWriteRateLimit, correctAdminPublishedResult);
