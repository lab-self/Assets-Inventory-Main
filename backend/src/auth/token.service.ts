import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  RefreshTokenPayload,
} from "../types/auth.js";

export function createAccessToken(
  app: FastifyInstance,
  user: AuthenticatedUser,
): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    isSuperAdmin: user.isSuperAdmin,
    type: "access",
  };

  const signOptions: { expiresIn: string } = {
    expiresIn: env.JWT_EXPIRES_IN,
  };

  return app.jwt.sign(payload, signOptions);
}

/**
 * Temporary refresh-token implementation.
 *
 * Refresh-token rotation and HttpOnly cookie handling will be
 * implemented in the production authentication hardening phase.
 */
export function createRefreshToken(
  app: FastifyInstance,
  user: AuthenticatedUser,
): string {
  const payload: RefreshTokenPayload = {
    sub: user.id,
    type: "refresh",
    tokenVersion: 1,
  };

  const signOptions: {
    expiresIn: string;
    secret?: string;
  } = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };

  if (env.JWT_REFRESH_SECRET) {
    signOptions.secret = env.JWT_REFRESH_SECRET;
  }

  return app.jwt.sign(payload as unknown as AccessTokenPayload, signOptions);
}