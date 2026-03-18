import express, { type Express } from "express";
import { getApiEnv } from "./config/env.js";
import { adminAuthRouter } from "./modules/admin-auth/admin-auth.routes.js";
import { resultsRouter } from "./modules/results/results.routes.js";
import { healthRouter } from "./routes/health.js";

function getAllowedOrigin(): string | null {
  const env = getApiEnv();
  return env.APP_URL ?? env.NEXT_PUBLIC_APP_URL ?? null;
}

export function createApp(): Express {
  const app = express();
  const allowedOrigin = getAllowedOrigin();

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    if (allowedOrigin && request.headers.origin === allowedOrigin) {
      response.header("Access-Control-Allow-Origin", allowedOrigin);
      response.header("Access-Control-Allow-Credentials", "true");
      response.header("Access-Control-Allow-Headers", "Content-Type");
      response.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
      response.header("Vary", "Origin");
    }

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  });
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.status(200).json({
      name: "thai-lottery-checker-api",
      status: "up"
    });
  });

  app.use("/health", healthRouter);
  app.use("/api/v1/admin/auth", adminAuthRouter);
  app.use("/api/v1/results", resultsRouter);

  return app;
}
