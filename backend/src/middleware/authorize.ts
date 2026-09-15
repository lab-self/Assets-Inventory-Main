import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { AppError } from "../utils/errors.js";

export function requirePermission(
  permission: string
) {
  return async (
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> => {
    const user =
      request.authenticatedUser;

    if (!user) {
      throw new AppError(
        "Authentication required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    /*
     * Super administrators bypass normal
     * permission checks.
     */
    if (user.isSuperAdmin) {
      return;
    }

    if (
      !user.permissions.includes(permission)
    ) {
      throw new AppError(
        "You do not have permission to perform this action.",
        403,
        "FORBIDDEN"
      );
    }
  };
}

export function requireRole(
  role: string
) {
  return async (
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> => {
    const user =
      request.authenticatedUser;

    if (!user) {
      throw new AppError(
        "Authentication required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    if (user.isSuperAdmin) {
      return;
    }

    if (!user.roles.includes(role)) {
      throw new AppError(
        "You do not have the required role.",
        403,
        "FORBIDDEN"
      );
    }
  };
}