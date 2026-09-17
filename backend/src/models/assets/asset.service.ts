import { randomUUID } from "node:crypto";
import {
  createAssetAssignment,
  findAssets,
  findAssignments,
  getActiveAssignment,
  getAssetById,
  getAssetBySerialNumber,
  getAssetByTag,
  getAssetCategories,
  getAssetCategoryById,
  getAssetStatuses,
  getAssetStatusById,
  insertAsset,
  insertAssetCategory,
  insertAssetStatus,
  reassignAsset,
  returnAssetAssignment,
  updateAssetById,
  updateAssetCategoryById,
  updateAssetStatusById,
} from "./asset.repository.js";

import type {
  AssignAssetInput,
  AssetListQuery,
  AssignmentListQuery,
  CreateAssetCategoryInput,
  CreateAssetInput,
  CreateAssetStatusInput,
  ReassignAssetInput,
  ReturnAssetInput,
  UpdateAssetCategoryInput,
  UpdateAssetInput,
  UpdateAssetStatusInput,
} from "./asset.schemas.js";

import { AppError } from "../../utils/errors.js";

function validateAssetDetails(other: boolean, input: { assetTag?: string; serialNumber?: string | null; companyId?: string | null; deviceTypeName?: string | null }) {
  if (other && !input.deviceTypeName) throw new AppError("Enter the Other device type name.", 400, "DEVICE_TYPE_REQUIRED");
  if (!other && (!input.assetTag || !input.serialNumber || !input.companyId)) {
    throw new AppError("Asset Tag / Hostname, serial number and company are required for this device type.", 400, "ASSET_DETAILS_REQUIRED");
  }
}

/**
 * ============================================================
 * ASSET
 * ============================================================
 */

export async function getAsset(
  assetId: string,
) {
  const asset = await getAssetById(assetId);

  if (!asset) {
    throw new AppError(
      "Asset not found",
      404,
      "ASSET_NOT_FOUND",
    );
  }

  return asset;
}

export async function getAssets(
  filters: AssetListQuery,
) {
  return findAssets(filters);
}

export async function createNewAsset(
  input: CreateAssetInput,
) {
  const category =
    await getAssetCategoryById(
      input.categoryId,
    );

  if (!category) {
    throw new AppError(
      "Asset category does not exist",
      400,
      "INVALID_ASSET_CATEGORY",
    );
  }

  if (!category.is_active) {
    throw new AppError(
      "Asset category is inactive",
      400,
      "INACTIVE_ASSET_CATEGORY",
    );
  }

  const other = /^others?$/i.test(category.name);
  validateAssetDetails(other, input);
  input.assetTag ||= `OTHER-${randomUUID()}`;
  if (!other) input.deviceTypeName = null;

  const existingTag = await getAssetByTag(
    input.assetTag,
  );

  if (existingTag) {
    throw new AppError(
      "An asset with this asset tag already exists",
      409,
      "ASSET_TAG_EXISTS",
    );
  }

  const existingSerial =
    input.serialNumber ? await getAssetBySerialNumber(input.serialNumber) : null;

  if (existingSerial) {
    throw new AppError(
      "An asset with this serial number already exists",
      409,
      "SERIAL_NUMBER_EXISTS",
    );
  }

  const status =
    await getAssetStatusById(
      input.statusId,
    );

  if (!status) {
    throw new AppError(
      "Asset status does not exist",
      400,
      "INVALID_ASSET_STATUS",
    );
  }

  if (!status.is_active) {
    throw new AppError(
      "Asset status is inactive",
      400,
      "INACTIVE_ASSET_STATUS",
    );
  }

  if (
    input.warrantyStartDate &&
    input.warrantyEndDate &&
    input.warrantyEndDate <
      input.warrantyStartDate
  ) {
    throw new AppError(
      "Warranty end date cannot be before warranty start date",
      400,
      "INVALID_WARRANTY_DATES",
    );
  }

  if (
    input.purchaseDate &&
    input.warrantyStartDate &&
    input.warrantyStartDate <
      input.purchaseDate
  ) {
    throw new AppError(
      "Warranty start date cannot be before purchase date",
      400,
      "INVALID_WARRANTY_START_DATE",
    );
  }

  return insertAsset(input);
}

export async function updateExistingAsset(
  assetId: string,
  input: UpdateAssetInput,
) {
  const existingAsset =
    await getAssetById(assetId);

  if (!existingAsset) {
    throw new AppError(
      "Asset not found",
      404,
      "ASSET_NOT_FOUND",
    );
  }

  if (input.isActive === false && await getActiveAssignment(assetId)) {
    throw new AppError("Return the assigned asset before deactivating it.", 409, "ASSET_STILL_ASSIGNED");
  }

  if (input.assetTag !== undefined) {
    const assetWithTag =
      await getAssetByTag(input.assetTag);

    if (
      assetWithTag &&
      assetWithTag.id !== assetId
    ) {
      throw new AppError(
        "An asset with this asset tag already exists",
        409,
        "ASSET_TAG_EXISTS",
      );
    }
  }

  if (input.serialNumber) {
    const assetWithSerial =
      await getAssetBySerialNumber(
        input.serialNumber,
      );

    if (
      assetWithSerial &&
      assetWithSerial.id !== assetId
    ) {
      throw new AppError(
        "An asset with this serial number already exists",
        409,
        "SERIAL_NUMBER_EXISTS",
      );
    }
  }

  if (input.categoryId !== undefined) {
    const category =
      await getAssetCategoryById(
        input.categoryId,
      );

    if (!category) {
      throw new AppError(
        "Asset category does not exist",
        400,
        "INVALID_ASSET_CATEGORY",
      );
    }

    if (!category.is_active) {
      throw new AppError(
        "Asset category is inactive",
        400,
        "INACTIVE_ASSET_CATEGORY",
      );
    }
  }

  const selectedCategory = await getAssetCategoryById(input.categoryId ?? existingAsset.category_id);
  const other = /^others?$/i.test(selectedCategory?.name || "");
  validateAssetDetails(other, {
    assetTag: input.assetTag ?? existingAsset.asset_tag,
    serialNumber: input.serialNumber === undefined ? existingAsset.serial_number : input.serialNumber,
    companyId: input.companyId === undefined ? existingAsset.company_id : input.companyId,
    deviceTypeName: input.deviceTypeName === undefined ? existingAsset.device_type_name : input.deviceTypeName,
  });
  if (!other && (input.categoryId !== undefined || input.deviceTypeName !== undefined)) input.deviceTypeName = null;

  if (input.statusId !== undefined) {
    const status =
      await getAssetStatusById(
        input.statusId,
      );

    if (!status) {
      throw new AppError(
        "Asset status does not exist",
        400,
        "INVALID_ASSET_STATUS",
      );
    }

    if (!status.is_active) {
      throw new AppError(
        "Asset status is inactive",
        400,
        "INACTIVE_ASSET_STATUS",
      );
    }
  }

  const purchaseDate =
    input.purchaseDate === undefined
      ? existingAsset.purchase_date
      : input.purchaseDate;

  const warrantyStartDate =
    input.warrantyStartDate === undefined
      ? existingAsset.warranty_start_date
      : input.warrantyStartDate;

  const warrantyEndDate =
    input.warrantyEndDate === undefined
      ? existingAsset.warranty_end_date
      : input.warrantyEndDate;

  if (
    warrantyStartDate &&
    warrantyEndDate &&
    warrantyEndDate <
      warrantyStartDate
  ) {
    throw new AppError(
      "Warranty end date cannot be before warranty start date",
      400,
      "INVALID_WARRANTY_DATES",
    );
  }

  if (
    purchaseDate &&
    warrantyStartDate &&
    warrantyStartDate <
      purchaseDate
  ) {
    throw new AppError(
      "Warranty start date cannot be before purchase date",
      400,
      "INVALID_WARRANTY_START_DATE",
    );
  }

  return updateAssetById(
    assetId,
    input,
  );
}

/**
 * ============================================================
 * ASSET ASSIGNMENT
 * ============================================================
 */

export async function assignAssetToUser(
  input: AssignAssetInput,
) {
  const asset =
    await getAssetById(input.assetId);

  if (!asset) {
    throw new AppError(
      "Asset not found",
      404,
      "ASSET_NOT_FOUND",
    );
  }

  if (!asset.is_active) {
    throw new AppError(
      "Inactive assets cannot be assigned",
      400,
      "INACTIVE_ASSET",
    );
  }

  if (!asset.status_is_assignable) {
    throw new AppError(
      "The current asset status does not allow assignment",
      400,
      "ASSET_NOT_ASSIGNABLE",
    );
  }

  return createAssetAssignment(input);
}

export async function getAssetAssignment(
  assetId: string,
) {
  const asset =
    await getAssetById(assetId);

  if (!asset) {
    throw new AppError(
      "Asset not found",
      404,
      "ASSET_NOT_FOUND",
    );
  }

  return getActiveAssignment(assetId);
}

export async function returnAssignedAsset(
  assetId: string,
  input: ReturnAssetInput,
) {
  const asset =
    await getAssetById(assetId);

  if (!asset) {
    throw new AppError(
      "Asset not found",
      404,
      "ASSET_NOT_FOUND",
    );
  }

  const activeAssignment =
    await getActiveAssignment(assetId);

  if (!activeAssignment) {
    throw new AppError(
      "Asset does not have an active assignment",
      400,
      "ASSET_NOT_ASSIGNED",
    );
  }

  const assignment =
    await returnAssetAssignment(
      assetId,
      input,
    );

  if (!assignment) {
    throw new AppError(
      "The active asset assignment could not be returned",
      409,
      "RETURN_FAILED",
    );
  }

  return assignment;
}

export async function reassignAssetToUser(
  assetId: string,
  input: ReassignAssetInput,
) {
  const asset =
    await getAssetById(assetId);

  if (!asset) {
    throw new AppError(
      "Asset not found",
      404,
      "ASSET_NOT_FOUND",
    );
  }

  if (!asset.is_active) {
    throw new AppError(
      "Inactive assets cannot be assigned",
      400,
      "INACTIVE_ASSET",
    );
  }

  if (!asset.status_is_assignable) {
    throw new AppError(
      "The current asset status does not allow assignment",
      400,
      "ASSET_NOT_ASSIGNABLE",
    );
  }

  const currentAssignment =
    await getActiveAssignment(assetId);

  if (!currentAssignment) {
    throw new AppError(
      "Asset does not have an active assignment",
      400,
      "ASSET_NOT_ASSIGNED",
    );
  }

  if (
    currentAssignment.user_id ===
    input.newUserId
  ) {
    throw new AppError(
      "Asset is already assigned to this user",
      400,
      "SAME_USER_ASSIGNMENT",
    );
  }

  return reassignAsset(
    assetId,
    input,
  );
}

/**
 * ============================================================
 * ASSIGNMENT HISTORY
 * ============================================================
 */

export async function getAssignments(
  filters: AssignmentListQuery,
) {
  return findAssignments(filters);
}

/**
 * ============================================================
 * ASSET CATEGORIES
 * ============================================================
 */

export async function getCategories() {
  return getAssetCategories();
}

export async function getCategory(
  categoryId: string,
) {
  const category =
    await getAssetCategoryById(
      categoryId,
    );

  if (!category) {
    throw new AppError(
      "Asset category not found",
      404,
      "ASSET_CATEGORY_NOT_FOUND",
    );
  }

  return category;
}

export async function createCategory(
  input: CreateAssetCategoryInput,
) {
  return insertAssetCategory(input);
}

export async function updateCategory(
  categoryId: string,
  input: UpdateAssetCategoryInput,
) {
  const category =
    await getAssetCategoryById(
      categoryId,
    );

  if (!category) {
    throw new AppError(
      "Asset category not found",
      404,
      "ASSET_CATEGORY_NOT_FOUND",
    );
  }

  return updateAssetCategoryById(
    categoryId,
    input,
  );
}

/**
 * ============================================================
 * ASSET STATUSES
 * ============================================================
 */

export async function getStatuses() {
  return getAssetStatuses();
}

export async function getStatus(
  statusId: string,
) {
  const status =
    await getAssetStatusById(
      statusId,
    );

  if (!status) {
    throw new AppError(
      "Asset status not found",
      404,
      "ASSET_STATUS_NOT_FOUND",
    );
  }

  return status;
}

export async function createStatus(
  input: CreateAssetStatusInput,
) {
  return insertAssetStatus(input);
}

export async function updateStatus(
  statusId: string,
  input: UpdateAssetStatusInput,
) {
  const status =
    await getAssetStatusById(
      statusId,
    );

  if (!status) {
    throw new AppError(
      "Asset status not found",
      404,
      "ASSET_STATUS_NOT_FOUND",
    );
  }

  return updateAssetStatusById(
    statusId,
    input,
  );
}
