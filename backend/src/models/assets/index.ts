export { assetRoutes } from "./asset.routes.js";

export {
  getAsset,
  getAssets,
  createNewAsset,
  updateExistingAsset,
  assignAssetToUser,
  getAssetAssignment,
  returnAssignedAsset,
  reassignAssetToUser,
  getAssignments,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  getStatuses,
  getStatus,
  createStatus,
  updateStatus,
} from "./asset.service.js";

export {
  assetConditionSchema,
  assetStorageTypeSchema,
  assignmentStatusSchema,
  createAssetSchema,
  updateAssetSchema,
  assetListQuerySchema,
  assignAssetSchema,
  returnAssetSchema,
  reassignAssetSchema,
  assignmentListQuerySchema,
  createAssetCategorySchema,
  updateAssetCategorySchema,
  createAssetStatusSchema,
  updateAssetStatusSchema,
} from "./asset.schemas.js";