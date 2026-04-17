import { Router, type Router as ExpressRouter } from "express";
import { createAdminLoginRateLimit, requireAllowedAdminOrigin } from "../../security/http.js";
import { getCurrentAdmin, loginAdmin, logoutAdmin } from "./admin-auth.controller.js";
import { requireAdminAuth } from "./admin-auth.middleware.js";

export const adminAuthRouter: ExpressRouter = Router();
const loginRateLimit = createAdminLoginRateLimit();

adminAuthRouter.use(requireAllowedAdminOrigin);
adminAuthRouter.post("/login", loginRateLimit, loginAdmin);
adminAuthRouter.post("/logout", logoutAdmin);
adminAuthRouter.get("/me", requireAdminAuth, getCurrentAdmin);
