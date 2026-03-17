import express, { type Express } from "express";
import { resultsRouter } from "./modules/results/results.routes.js";
import { healthRouter } from "./routes/health.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.status(200).json({
      name: "thai-lottery-checker-api",
      status: "up"
    });
  });

  app.use("/health", healthRouter);
  app.use("/api/v1/results", resultsRouter);

  return app;
}
