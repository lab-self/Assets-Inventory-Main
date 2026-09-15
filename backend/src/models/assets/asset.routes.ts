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

export async function assetRoutes(
  app: FastifyInstance,
): Promise<void> {
  /*
   * ============================================================
   * ASSETS
   * ============================================================
   */

  /**
   * GET /api/assets
   *
   * List assets with pagination, search and filters.
   */
  app.get(
    "/assets",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.read"),
      ],
    },
    async (request) => {
      const query = assetListQuerySchema.parse(request.query);

      return getAssets(query);
    },
  );

  /**
   * GET /api/assets/:id
   *
   * Get complete asset information.
   */
  app.get(
    "/assets/:id",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.read"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      return getAsset(id);
    },
  );

  /**
   * POST /api/assets
   *
   * Create a new asset.
   */
  app.post(
    "/assets",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.create"),
      ],
    },
    async (request, reply) => {
      const input = createAssetSchema.parse(request.body);

      const asset = await createNewAsset(input);

      return reply.code(201).send(asset);
    },
  );

  /**
   * PATCH /api/assets/:id
   *
   * Update an existing asset.
   */
  app.patch(
    "/assets/:id",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.update"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      const input = updateAssetSchema.parse(request.body);

      return updateExistingAsset(id, input);
    },
  );

  /*
   * ============================================================
   * ASSET ASSIGNMENT
   * ============================================================
   */

  /**
   * GET /api/assets/:id/assignment
   *
   * Get the currently active assignment.
   */
  app.get(
    "/assets/:id/assignment",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.read"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      return getAssetAssignment(id);
    },
  );

  /**
   * POST /api/assets/:id/assign
   *
   * Assign an asset to an employee/user.
   */
  app.post(
    "/assets/:id/assign",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.assign"),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const input = assignAssetSchema.parse(request.body);

      const assignment = await assignAssetToUser({
        ...input,
        assetId: id,
      });

      return reply.code(201).send(assignment);
    },
  );

  /**
   * POST /api/assets/:id/return
   *
   * Return an assigned asset.
   */
  app.post(
    "/assets/:id/return",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.return"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      const input = returnAssetSchema.parse(request.body);

      return returnAssignedAsset(id, input);
    },
  );

  /**
   * POST /api/assets/:id/reassign
   *
   * Reassign an asset from one employee to another.
   */
  app.post(
    "/assets/:id/reassign",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.assign"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      const input = reassignAssetSchema.parse(request.body);

      return reassignAssetToUser(id, input);
    },
  );

  /**
   * GET /api/assets/assignments
   *
   * Assignment history.
   */
  app.get(
    "/assets/assignments",
    {
      preHandler: [
        authenticate,
        requirePermission("assets.read"),
      ],
    },
    async (request) => {
      const query = assignmentListQuerySchema.parse(request.query);

      return getAssignments(query);
    },
  );

  /*
   * ============================================================
   * ASSET CATEGORIES
   * ============================================================
   */

  /**
   * GET /api/assets/categories
   */
  app.get(
    "/assets/categories",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_categories.read"),
      ],
    },
    async () => {
      return getCategories();
    },
  );

  /**
   * GET /api/assets/categories/:id
   */
  app.get(
    "/assets/categories/:id",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_categories.read"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      return getCategory(id);
    },
  );

  /**
   * POST /api/assets/categories
   */
  app.post(
    "/assets/categories",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_categories.create"),
      ],
    },
    async (request, reply) => {
      const input = createAssetCategorySchema.parse(request.body);

      const category = await createCategory(input);

      return reply.code(201).send(category);
    },
  );

  /**
   * PATCH /api/assets/categories/:id
   */
  app.patch(
    "/assets/categories/:id",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_categories.update"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      const input = updateAssetCategorySchema.parse(request.body);

      return updateCategory(id, input);
    },
  );

  /*
   * ============================================================
   * ASSET STATUSES
   * ============================================================
   */

  /**
   * GET /api/assets/statuses
   */
  app.get(
    "/assets/statuses",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_statuses.read"),
      ],
    },
    async () => {
      return getStatuses();
    },
  );

  /**
   * GET /api/assets/statuses/:id
   */
  app.get(
    "/assets/statuses/:id",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_statuses.read"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      return getStatus(id);
    },
  );

  /**
   * POST /api/assets/statuses
   */
  app.post(
    "/assets/statuses",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_statuses.create"),
      ],
    },
    async (request, reply) => {
      const input = createAssetStatusSchema.parse(request.body);

      const status = await createStatus(input);

      return reply.code(201).send(status);
    },
  );

  /**
   * PATCH /api/assets/statuses/:id
   */
  app.patch(
    "/assets/statuses/:id",
    {
      preHandler: [
        authenticate,
        requirePermission("asset_statuses.update"),
      ],
    },
    async (request) => {
      const { id } = request.params as { id: string };

      const input = updateAssetStatusSchema.parse(request.body);

      return updateStatus(id, input);
    },
  );
}
