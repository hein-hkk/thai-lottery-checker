import { Router, type Router as ExpressRouter } from "express";
import { createCheckerCheckRateLimit, createPublicReadRateLimit } from "../../security/http.js";
import { checkTicket, getCheckerDrawOptions } from "./checker.controller.js";

export const checkerRouter: ExpressRouter = Router();
const publicReadRateLimit = createPublicReadRateLimit();
const checkerCheckRateLimit = createCheckerCheckRateLimit();

checkerRouter.get("/draws", publicReadRateLimit, getCheckerDrawOptions);
checkerRouter.post("/check", checkerCheckRateLimit, checkTicket);
