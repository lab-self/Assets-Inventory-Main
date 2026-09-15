import type { FastifyInstance } from "fastify";

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

export async function userRoutes(
  app: FastifyInstance,
): Promise<void> {
  /**
   * GET /api/users
   */
  app.get(
    "/",
    {
      preHandler: [requirePermission("users.read")],
    },
    async (request) => {
      const query = userListQuerySchema.parse(request.query);

      return getUsers(query);
    },
  );

  /**
   * GET /api/users/:id
   */
  app.get(
    "/:id",
    {
      preHandler: [requirePermission("users.read")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return getUser(params.id);
    },
  );

  /**
   * POST /api/users
   */
  app.post(
    "/",
    {
      preHandler: [requirePermission("users.create")],
    },
    async (request, reply) => {
      const input = createUserSchema.parse(request.body);

      const user = await createNewUser(input);

      return reply.code(201).send(user);
    },
  );

  /**
   * PATCH /api/users/:id
   */
  app.patch(
    "/:id",
    {
      preHandler: [requirePermission("users.update")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      const input = updateUserSchema.parse(request.body);

      return updateUser(params.id, input);
    },
  );

  /**
   * PATCH /api/users/:id/password
   */
  app.patch(
    "/:id/password",
    {
      preHandler: [requirePermission("users.update")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      const input = updatePasswordSchema.parse(request.body);

      return changeUserPassword(params.id, {
        password: input.password,
      });
    },
  );

  /**
   * DELETE /api/users/:id
   */
  app.delete(
    "/:id",
    {
      preHandler: [requirePermission("users.delete")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return deleteUser(params.id);
    },
  );
}