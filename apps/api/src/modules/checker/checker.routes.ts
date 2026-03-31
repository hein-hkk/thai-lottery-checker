import { Router, type Router as ExpressRouter } from "express";
import { checkTicket, getCheckerDrawOptions } from "./checker.controller.js";

export const checkerRouter: ExpressRouter = Router();

checkerRouter.get("/draws", getCheckerDrawOptions);
checkerRouter.post("/check", checkTicket);
