import type { FastifyInstance } from "fastify";

import { query } from "../database/index.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";

export async function roleRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/roles",
    {
      preHandler: [authenticate, requirePermission("users.manage_roles")],
    },
    async () => {
      const result = await query<{
        id: string;
        code: string;
        name: string;
        description: string | null;
      }>(
        `SELECT id, code, name, description FROM roles WHERE is_active = TRUE ORDER BY name`,
      );

      return result.rows;
    },
  );
}
