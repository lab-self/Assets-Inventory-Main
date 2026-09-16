import type { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "../../utils/errors.js";

import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/authorize.js";

import {
  createNewUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  changeUserPassword,
} from "./user.service.js";

import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
  userListQuerySchema,
} from "./user.schemas.js";

export async function userRoutes(app: FastifyInstance): Promise<void> {
  async function checkAccessChanges(request: FastifyRequest) {
    const input = request.body as { isSuperAdmin?: boolean; roleIds?: string[] };
    const actor = request.authenticatedUser!;
    if (!actor.isSuperAdmin && input.isSuperAdmin !== undefined) {
      throw new AppError("Only a super administrator can change super administrator access.", 403, "FORBIDDEN");
    }
    if (!actor.isSuperAdmin && input.roleIds !== undefined && !actor.permissions.includes("USER_ROLE_MANAGE")) {
      throw new AppError("You do not have permission to assign roles.", 403, "FORBIDDEN");
    }
  }
  app.get(
    "/",
    { preHandler: [authenticate, requirePermission("users.read")] },
    async (request) => getUsers(userListQuerySchema.parse(request.query)),
  );

  app.get(
    "/:id",
    { preHandler: [authenticate, requirePermission("users.read")] },
    async (request) => getUser((request.params as { id: string }).id),
  );

  app.post(
    "/",
    { preHandler: [authenticate, requirePermission("users.create"), checkAccessChanges] },
    async (request, reply) => reply.code(201).send(await createNewUser(createUserSchema.parse(request.body))),
  );

  app.patch(
    "/:id",
    { preHandler: [authenticate, requirePermission("users.update"), checkAccessChanges] },
    async (request) => updateUser((request.params as { id: string }).id, updateUserSchema.parse(request.body)),
  );

  app.patch(
    "/:id/password",
    { preHandler: [authenticate, requirePermission("users.update")] },
    async (request) => changeUserPassword((request.params as { id: string }).id, updatePasswordSchema.parse(request.body)),
  );

  app.delete(
    "/:id",
    { preHandler: [authenticate, requirePermission("users.delete")] },
    async (request) => deleteUser((request.params as { id: string }).id),
  );
}
