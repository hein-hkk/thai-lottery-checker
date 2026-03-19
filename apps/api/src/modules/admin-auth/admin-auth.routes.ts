import { Router, type Router as ExpressRouter } from "express";
import { getCurrentAdmin, loginAdmin, logoutAdmin } from "./admin-auth.controller.js";
import { requireAdminAuth } from "./admin-auth.middleware.js";

export const adminAuthRouter: ExpressRouter = Router();

adminAuthRouter.post("/login", loginAdmin);
adminAuthRouter.post("/logout", logoutAdmin);
adminAuthRouter.get("/me", requireAdminAuth, getCurrentAdmin);
