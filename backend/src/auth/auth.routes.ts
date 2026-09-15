// ============================================================
// Authentication Routes
// ============================================================

import type { FastifyInstance } from "fastify";

import {
  loginSchema
} from "./auth.schemas.js";

import {
  authenticate
} from "./auth.service.js";

import {
  success
} from "../utils/response.js";

import {
  authenticate as authenticateRequest
} from "../middleware/authenticate.js";

export async function authRoutes(
  app: FastifyInstance
): Promise<void> {
  // ==========================================================
  // Login
  // ==========================================================

  app.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const parsed =
        loginSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Invalid login request.",
            details:
              parsed.error.flatten()
          }
        });
      }

      const result =
        await authenticate(
          app,
          parsed.data
        );

      return reply.send(
        success({
          accessToken:
            result.tokens.accessToken,

          refreshToken:
            result.tokens.refreshToken,

          expiresIn:
            result.tokens.expiresIn,

          user: result.user
        })
      );
    }
  );

  // ==========================================================
  // Current User
  // ==========================================================

  app.get(
    "/me",
    {
      preHandler: authenticateRequest
    },
    async (request) => {
      return success(
        request.authenticatedUser
      );
    }
  );
}