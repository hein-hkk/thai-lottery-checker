import { Router, type Router as ExpressRouter } from "express";
import {
  getLatestResults,
  getResultsByDrawDate,
  getResultsHistory
} from "./results.controller.js";

export const resultsRouter: ExpressRouter = Router();

resultsRouter.get("/latest", getLatestResults);
resultsRouter.get("/", getResultsHistory);
resultsRouter.get("/:drawDate", getResultsByDrawDate);
