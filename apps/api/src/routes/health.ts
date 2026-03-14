import type { ServiceStatus } from "@thai-lottery-checker/types";
import { formatIsoTimestamp } from "@thai-lottery-checker/utils";
import { Router, type Router as ExpressRouter } from "express";
import { checkDatabaseConnection } from "../db/client.js";

export const healthRouter: ExpressRouter = Router();

healthRouter.get("/", async (_request, response) => {
  const databaseUp = await checkDatabaseConnection();
  const services: ServiceStatus[] = [
    { name: "api", status: "up" },
    { name: "database", status: databaseUp ? "up" : "down" }
  ];

  response.status(200).json({
    status: databaseUp ? "ok" : "degraded",
    checkedAt: formatIsoTimestamp(new Date()),
    services
  });
});
