// ============================================================
// Authentication Service
// ============================================================

import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import { readOperationalSettings } from "../admin/settings.js";

import {
  findUserForAuthentication,
  toAuthenticatedUser,
  updateFailedLogin,
  updateSuccessfulLogin
} from "./auth.repository.js";

import {
  createAccessToken,
  createRefreshToken
} from "./token.service.js";

import { verifyPassword } from "../utils/password.js";

import { AppError } from "../utils/errors.js";

import type {
  AuthenticationResult,
  LoginCredentials
} from "./auth.types.js";


export async function authenticate(
  app: FastifyInstance,
  credentials: LoginCredentials
): Promise<AuthenticationResult> {
  const user =
    await findUserForAuthentication(
      credentials.email
    );

  /*
   * Do not reveal whether the email exists.
   */
  if (!user) {
    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  /*
   * Account status validation.
   */
  if (user.status === "inactive") {
    throw new AppError(
      "This account is inactive.",
      403,
      "ACCOUNT_INACTIVE"
    );
  }

  if (user.status === "suspended") {
    throw new AppError(
      "This account has been suspended.",
      403,
      "ACCOUNT_SUSPENDED"
    );
  }

  if (user.status === "locked" || (user.locked_until && user.locked_until.getTime() > Date.now())) {
      throw new AppError(
        "This account is temporarily locked.",
        423,
        "ACCOUNT_LOCKED"
      );
  }

  /*
   * Verify Argon2id password.
   */
  const passwordValid =
  await verifyPassword(
    credentials.password,
    user.password_hash
  );

  if (!passwordValid) {
    const settings = await readOperationalSettings();
    const failedAttempts =
      (user.locked_until && user.locked_until.getTime() <= Date.now() ? 0 : user.failed_login_attempts) + 1;

    const shouldLock =
      failedAttempts >= Number(settings["security.max_login_attempts"]);

    const lockUntil = shouldLock
      ? new Date(
          Date.now() +
            Number(settings["security.lockout_minutes"]) * 60 * 1000
        )
      : null;

    await updateFailedLogin(
      user.id,
      failedAttempts,
      lockUntil
    );

    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  /*
   * Successful authentication.
   */
  await updateSuccessfulLogin(user.id);

  const authenticatedUser =
    toAuthenticatedUser(user);

  const accessToken =
    createAccessToken(
      app,
      authenticatedUser
    );

  const refreshToken =
    createRefreshToken(
      app,
      authenticatedUser
    );

  return {
    user: authenticatedUser,

    tokens: {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN
    }
  };
}
