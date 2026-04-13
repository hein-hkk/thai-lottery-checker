import express, { type Express } from "express";
import { getApiEnv } from "./config/env.js";
import { adminAuthRouter } from "./modules/admin-auth/admin-auth.routes.js";
import { adminBlogsRouter } from "./modules/admin-blogs/admin-blogs.routes.js";
import { adminGovernanceRouter } from "./modules/admin-governance/admin-governance.routes.js";
import { adminResultsRouter } from "./modules/admin-results/admin-results.routes.js";
import { blogRouter } from "./modules/blog/blog.routes.js";
import { checkerRouter } from "./modules/checker/checker.routes.js";
import { resultsRouter } from "./modules/results/results.routes.js";
import { healthRouter } from "./routes/health.js";
import { applyCors, applyRequestContext, applySecurityHeaders } from "./security/http.js";

function resolveTrustProxySetting(rawValue: string): boolean | number | string {
  const trimmed = rawValue.trim().toLowerCase();

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return rawValue;
}

export function createApp(): Express {
  const app = express();
  const env = getApiEnv();

  app.set("trust proxy", resolveTrustProxySetting(env.API_TRUST_PROXY));
  app.disable("x-powered-by");
  app.use(applyRequestContext);
  app.use(applySecurityHeaders);
  app.use(applyCors);
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.status(200).json({
      name: "thai-lottery-checker-api",
      status: "up"
    });
  });

  app.use("/health", healthRouter);
  app.use("/api/v1/admin/auth", adminAuthRouter);
  app.use("/api/v1/admin", adminBlogsRouter);
  app.use("/api/v1/admin", adminGovernanceRouter);
  app.use("/api/v1/admin", adminResultsRouter);
  app.use("/api/v1/blogs", blogRouter);
  app.use("/api/v1/checker", checkerRouter);
  app.use("/api/v1/results", resultsRouter);

  return app;
}
