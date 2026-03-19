import { Router, type Router as ExpressRouter } from "express";
import { requireAdminAuth } from "../admin-auth/admin-auth.middleware.js";
import {
  correctAdminPublishedResult,
  createAdminResultDraft,
  getAdminResultDetail,
  listAdminResults,
  publishAdminResultDraft,
  updateAdminResultDraft
} from "./admin-results.controller.js";

export const adminResultsRouter: ExpressRouter = Router();

adminResultsRouter.get("/results", requireAdminAuth, listAdminResults);
adminResultsRouter.get("/results/:id", requireAdminAuth, getAdminResultDetail);
adminResultsRouter.post("/results", requireAdminAuth, createAdminResultDraft);
adminResultsRouter.patch("/results/:id", requireAdminAuth, updateAdminResultDraft);
adminResultsRouter.post("/results/:id/publish", requireAdminAuth, publishAdminResultDraft);
adminResultsRouter.patch("/results/:id/correct", requireAdminAuth, correctAdminPublishedResult);
