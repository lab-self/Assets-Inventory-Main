import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/authorize.js";

import {
  assignmentListQuerySchema,
  assetListQuerySchema,
  assignAssetSchema,
  createAssetCategorySchema,
  createAssetSchema,
  createAssetStatusSchema,
  reassignAssetSchema,
  returnAssetSchema,
  updateAssetCategorySchema,
  updateAssetSchema,
  updateAssetStatusSchema,
} from "./asset.schemas.js";

import {
  assignAssetToUser,
  createCategory,
  createNewAsset,
  createStatus,
  getAsset,
  getAssetAssignment,
  getAssets,
  getCategories,
  getCategory,
  getAssignments,
  getStatuses,
  getStatus,
  reassignAssetToUser,
  returnAssignedAsset,
  updateCategory,
  updateExistingAsset,
  updateStatus,
} from "./asset.service.js";

export async function assetRoutes(app: FastifyInstance): Promise<void> {
  app.get("/assets", { preHandler: [authenticate, requirePermission("assets.read")] }, async (request) => {
    return getAssets(assetListQuerySchema.parse(request.query));
  });

  app.get("/assets/:id", { preHandler: [authenticate, requirePermission("assets.read")] }, async (request) => {
    return getAsset((request.params as { id: string }).id);
  });

  app.post("/assets", { preHandler: [authenticate, requirePermission("assets.create")] }, async (request, reply) => {
    return reply.code(201).send(await createNewAsset(createAssetSchema.parse(request.body)));
  });

  app.patch("/assets/:id", { preHandler: [authenticate, requirePermission("assets.update")] }, async (request) => {
    const { id } = request.params as { id: string };
    return updateExistingAsset(id, updateAssetSchema.parse(request.body));
  });

  app.delete("/assets/:id", { preHandler: [authenticate, requirePermission("assets.delete")] }, async (request) => {
    const { id } = request.params as { id: string };
    return updateExistingAsset(id, { isActive: false });
  });

  app.get("/assets/:id/assignment", { preHandler: [authenticate, requirePermission("assets.read")] }, async (request) => {
    return getAssetAssignment((request.params as { id: string }).id);
  });

  app.post("/assets/:id/assign", { preHandler: [authenticate, requirePermission("assets.assign")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = assignAssetSchema.parse({ ...(request.body as Record<string, unknown>), assetId: id });
    return reply.code(201).send(await assignAssetToUser(input));
  });

  app.post("/assets/:id/return", { preHandler: [authenticate, requirePermission("assets.return")] }, async (request) => {
    const { id } = request.params as { id: string };
    return returnAssignedAsset(id, returnAssetSchema.parse(request.body));
  });

  app.post("/assets/:id/reassign", { preHandler: [authenticate, requirePermission("assets.assign")] }, async (request) => {
    const { id } = request.params as { id: string };
    return reassignAssetToUser(id, reassignAssetSchema.parse(request.body));
  });

  app.get("/assets/assignments", { preHandler: [authenticate, requirePermission("assets.read")] }, async (request) => {
    return getAssignments(assignmentListQuerySchema.parse(request.query));
  });

  app.get("/assets/categories", { preHandler: [authenticate, requirePermission("asset_categories.read")] }, async () => getCategories());
  app.get("/assets/categories/:id", { preHandler: [authenticate, requirePermission("asset_categories.read")] }, async (request) => getCategory((request.params as { id: string }).id));
  app.post("/assets/categories", { preHandler: [authenticate, requirePermission("asset_categories.create")] }, async (request, reply) => reply.code(201).send(await createCategory(createAssetCategorySchema.parse(request.body))));
  app.patch("/assets/categories/:id", { preHandler: [authenticate, requirePermission("asset_categories.update")] }, async (request) => updateCategory((request.params as { id: string }).id, updateAssetCategorySchema.parse(request.body)));

  app.get("/assets/statuses", { preHandler: [authenticate, requirePermission("asset_statuses.read")] }, async () => getStatuses());
  app.get("/assets/statuses/:id", { preHandler: [authenticate, requirePermission("asset_statuses.read")] }, async (request) => getStatus((request.params as { id: string }).id));
  app.post("/assets/statuses", { preHandler: [authenticate, requirePermission("asset_statuses.create")] }, async (request, reply) => reply.code(201).send(await createStatus(createAssetStatusSchema.parse(request.body))));
  app.patch("/assets/statuses/:id", { preHandler: [authenticate, requirePermission("asset_statuses.update")] }, async (request) => updateStatus((request.params as { id: string }).id, updateAssetStatusSchema.parse(request.body)));
}
