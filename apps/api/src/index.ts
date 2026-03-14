import { createServer, type Server } from "node:http";
import { createApp } from "./app.js";
import { getApiEnv } from "./config/env.js";
import { disconnectDatabase } from "./db/client.js";

const SHUTDOWN_SIGNALS = ["SIGINT", "SIGTERM"] as const;

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function bootstrap(): Promise<void> {
  const env = getApiEnv();
  const app = createApp();
  const server = createServer(app);
  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      console.log(`Shutdown already in progress, ignoring ${signal}`);
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown`);

    try {
      await closeServer(server);
      console.log("HTTP server closed");
      await disconnectDatabase();
      console.log("Prisma disconnected");
      process.exit(0);
    } catch (error) {
      console.error("Graceful shutdown failed", error);

      try {
        await disconnectDatabase();
        console.log("Prisma disconnected after shutdown failure");
      } catch (disconnectError) {
        console.error("Prisma disconnect failed during shutdown", disconnectError);
      }

      process.exit(1);
    }
  };

  SHUTDOWN_SIGNALS.forEach((signal) => {
    process.on(signal, () => {
      void shutdown(signal);
    });
  });

  await listen(server, env.API_PORT);
  console.log(`API server listening on http://localhost:${env.API_PORT}`);
}

bootstrap().catch((error) => {
  console.error("API startup failed", error);
  process.exit(1);
});
