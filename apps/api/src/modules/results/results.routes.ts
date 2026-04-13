import { Router, type Router as ExpressRouter } from "express";
import { createPublicReadRateLimit } from "../../security/http.js";
import {
  getLatestResults,
  getResultsByDrawDate,
  getResultsHistory
} from "./results.controller.js";

export const resultsRouter: ExpressRouter = Router();
const publicReadRateLimit = createPublicReadRateLimit();

resultsRouter.get("/latest", publicReadRateLimit, getLatestResults);
resultsRouter.get("/", publicReadRateLimit, getResultsHistory);
resultsRouter.get("/:drawDate", publicReadRateLimit, getResultsByDrawDate);
