import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";

import { env } from "./config/env.js";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./database/index.js";
import { authRoutes } from "./auth/auth.routes.js";
import { userRoutes } from "./models/users/user.routes.js";
import { organizationRoutes } from "./models/organization/organization.routes.js";
import { assetRoutes } from "./models/assets/index.js";
import { adminRoutes } from "./admin/admin.routes.js";
import { roleRoutes } from "./admin/role.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { logger, loggerOptions } from "./utils/logger.js";

const app = Fastify({
  logger: loggerOptions,
  trustProxy: env.NODE_ENV === "production",
});

async function registerPlugins(): Promise<void> {
  await app.register(helmet, { global: true });
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(cookie, { secret: env.SESSION_SECRET });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(multipart, { limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 } });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(sensible);
}

async function registerRoutes(): Promise<void> {
  app.get("/api", async () => ({
    success: true,
    name: env.APP_NAME,
    version: env.APP_VERSION,
    environment: env.NODE_ENV,
  }));

  app.get("/api/health", async (_request, reply) => {
    try {
      await checkDatabaseConnection();
      return reply.code(200).send({
        success: true,
        status: "healthy",
        service: env.APP_NAME,
        version: env.APP_VERSION,
        database: "healthy",
        timestamp: new Date().toISOString(),
      });
    } catch {
      return reply.code(503).send({
        success: false,
        status: "unhealthy",
        service: env.APP_NAME,
        version: env.APP_VERSION,
        database: "unhealthy",
        timestamp: new Date().toISOString(),
      });
    }
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(organizationRoutes, { prefix: "/api" });
  await app.register(assetRoutes, { prefix: "/api" });
  await app.register(adminRoutes, { prefix: "/api" });
  await app.register(roleRoutes, { prefix: "/api" });
}

async function start(): Promise<void> {
  try {
    await registerPlugins();
    app.setErrorHandler(errorHandler);
    await registerRoutes();
    await checkDatabaseConnection();

    logger.info(
      { database: env.DATABASE_NAME, host: env.DATABASE_HOST, port: env.DATABASE_PORT },
      "Database connection established",
    );

    await app.listen({ host: env.APP_HOST, port: env.APP_PORT });
    logger.info(
      { host: env.APP_HOST, port: env.APP_PORT, environment: env.NODE_ENV },
      `${env.APP_NAME} API started successfully`,
    );
  } catch (error) {
    logger.error({ error }, "Failed to start application");
    await closeDatabaseConnection();
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutdown signal received");
  try {
    await app.close();
    await closeDatabaseConnection();
    logger.info("Application shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error during application shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
void start();
