import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../utils/errors.js";

import {
  findUserForAuthentication,
  toAuthenticatedUser
} from "../auth/auth.repository.js";

import type { AccessTokenPayload } from "../types/auth.js";

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    const token =
      request.user as AccessTokenPayload;

    if (token.type !== "access") {
      throw new AppError(
        "Invalid access token.",
        401,
        "INVALID_ACCESS_TOKEN"
      );
    }

    const user =
      await findUserForAuthentication(
        token.sub
      );

    if (!user) {
      throw new AppError(
        "User account no longer exists.",
        401,
        "USER_NOT_FOUND"
      );
    }

    if (user.status !== "active") {
      throw new AppError(
        "User account is not active.",
        403,
        "ACCOUNT_NOT_ACTIVE"
      );
    }

    request.authenticatedUser =
      toAuthenticatedUser(user);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Authentication required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }
}