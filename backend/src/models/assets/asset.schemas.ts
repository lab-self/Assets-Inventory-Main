import { isIP } from "node:net";
import { z } from "zod";

/**
 * ============================================================
 * COMMON
 * ============================================================
 */

const uuidSchema = z.string().uuid();

const optionalUuidSchema = uuidSchema.nullable().optional();

const dateSchema = z.string().date();

const optionalDateSchema = dateSchema.nullable().optional();

const nonEmptyString = z.string().trim().min(1);

const optionalString = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();

const positiveNumber = z.number().nonnegative();

const optionalPositiveNumber = positiveNumber
  .nullable()
  .optional();

const ipAddressSchema = z
  .string()
  .trim()
  .refine((value) => isIP(value) > 0, {
    message: "Invalid IP address",
  });

/**
 * ============================================================
 * ASSET ENUMS
 * ============================================================
 */

export const assetConditionSchema = z.enum([
  "new",
  "good",
  "fair",
  "poor",
  "damaged",
]);

export const assetStorageTypeSchema = z.enum([
  "hdd",
  "ssd",
  "sata_ssd",
  "nvme",
  "hybrid",
  "none",
]);

export const assignmentStatusSchema = z.enum([
  "assigned",
  "returned",
  "lost",
  "disposed",
]);

/**
 * ============================================================
 * ASSET CREATE
 * ============================================================
 *
 * Used when creating a new physical IT asset.
 */
export const createAssetSchema = z.object({
  assetTag: nonEmptyString
    .max(100)
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Asset tag may contain only letters, numbers, dots, hyphens and underscores",
    ).optional(),

  serialNumber: nonEmptyString
    .max(150).nullable().optional(),

  categoryId: uuidSchema,

  statusId: uuidSchema,

  companyId: optionalUuidSchema,
  deviceTypeName: z.string().trim().min(1).max(100).nullable().optional(),
  antivirus: z.string().trim().min(1).max(150).nullable().optional(),
  ramUnit: z.enum(["GB", "TB"]).default("GB"),
  storageUnit: z.enum(["GB", "TB"]).default("GB"),

  departmentId: optionalUuidSchema,

  locationId: optionalUuidSchema,

  manufacturer: optionalString,

  model: optionalString,

  purchaseDate: optionalDateSchema,

  purchaseCost: optionalPositiveNumber,

  currency: z
    .string()
    .trim()
    .length(3)
    .toUpperCase()
    .default("INR"),

  warrantyStartDate: optionalDateSchema,

  warrantyEndDate: optionalDateSchema,

  vendor: optionalString,

  invoiceNumber: optionalString,

  condition: assetConditionSchema.default("new"),

  hostname: optionalString,

  operatingSystem: optionalString,

  cpu: optionalString,

  ramGb: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  storageType: assetStorageTypeSchema.default("none"),

  storageCapacityGb: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  gpu: optionalString,
  graphicsMemoryGb: z.number().int().positive().max(2147483647).nullable().optional(),

  macAddress: z
    .string()
    .trim()
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/,
      "Invalid MAC address",
    )
    .nullable()
    .optional(),

  ipAddress: ipAddressSchema
    .nullable()
    .optional(),

  notes: optionalString,
});

/**
 * ============================================================
 * ASSET UPDATE
 * ============================================================
 */

export const updateAssetSchema = z
  .object({
    assetTag: nonEmptyString
      .max(100)
      .regex(
        /^[A-Za-z0-9._-]+$/,
        "Asset tag may contain only letters, numbers, dots, hyphens and underscores",
      )
      .optional(),

    serialNumber: nonEmptyString
      .max(150)
      .nullable()
      .optional(),

    categoryId: uuidSchema.optional(),

    statusId: uuidSchema.optional(),

    companyId: optionalUuidSchema,
    deviceTypeName: z.string().trim().min(1).max(100).nullable().optional(),
    antivirus: z.string().trim().min(1).max(150).nullable().optional(),
    ramUnit: z.enum(["GB", "TB"]).optional(),
    storageUnit: z.enum(["GB", "TB"]).optional(),

    departmentId: optionalUuidSchema,

    locationId: optionalUuidSchema,

    manufacturer: optionalString,

    model: optionalString,

    purchaseDate: optionalDateSchema,

    purchaseCost: optionalPositiveNumber,

    currency: z
      .string()
      .trim()
      .length(3)
      .toUpperCase()
      .optional(),

    warrantyStartDate: optionalDateSchema,

    warrantyEndDate: optionalDateSchema,

    vendor: optionalString,

    invoiceNumber: optionalString,

    condition: assetConditionSchema.optional(),

    hostname: optionalString,

    operatingSystem: optionalString,

    cpu: optionalString,

    ramGb: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    storageType: assetStorageTypeSchema.optional(),

    storageCapacityGb: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    gpu: optionalString,
    graphicsMemoryGb: z.number().int().positive().max(2147483647).nullable().optional(),

    macAddress: z
      .string()
      .trim()
      .regex(
        /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/,
        "Invalid MAC address",
      )
      .nullable()
      .optional(),

    ipAddress: ipAddressSchema
      .nullable()
      .optional(),

    notes: optionalString,

    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided for update",
    },
  );

/**
 * ============================================================
 * ASSET LIST FILTERS
 * ============================================================
 */

export const assetListQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(200)
    .optional(),

  assetTag: z
    .string()
    .trim()
    .max(100)
    .optional(),

  serialNumber: z
    .string()
    .trim()
    .max(150)
    .optional(),

  categoryId: uuidSchema.optional(),

  statusId: uuidSchema.optional(),

  companyId: uuidSchema.optional(),

  departmentId: uuidSchema.optional(),

  locationId: uuidSchema.optional(),

  condition: assetConditionSchema.optional(),

  assigned: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  warrantyExpiring: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default(true)
    .optional(),

  page: z
    .coerce
    .number()
    .int()
    .positive()
    .default(1),

  pageSize: z
    .coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(25),

  sortBy: z
    .enum([
      "assetTag",
      "hostname",
      "serialNumber",
      "createdAt",
      "updatedAt",
      "purchaseDate",
      "warrantyEndDate",
    ])
    .default("createdAt"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

/**
 * ============================================================
 * ASSET ASSIGNMENT
 * ============================================================
 */

export const assignAssetSchema = z.object({
  assetId: uuidSchema,

  userId: uuidSchema,

  assignedDate: z
    .string()
    .datetime()
    .optional(),

  expectedReturnDate: z
    .string()
    .datetime()
    .nullable()
    .optional(),

  notes: optionalString,
});

/**
 * ============================================================
 * ASSET RETURN
 * ============================================================
 */

export const returnAssetSchema = z.object({
  returnedDate: z
    .string()
    .datetime()
    .optional(),

  conditionOnReturn: assetConditionSchema.optional(),

  notes: optionalString,
});

/**
 * ============================================================
 * ASSET REASSIGNMENT
 * ============================================================
 */

export const reassignAssetSchema = z.object({
  newUserId: uuidSchema,

  assignedDate: z
    .string()
    .datetime()
    .optional(),

  expectedReturnDate: z
    .string()
    .datetime()
    .nullable()
    .optional(),

  notes: optionalString,
});

/**
 * ============================================================
 * ASSIGNMENT LIST FILTERS
 * ============================================================
 */

export const assignmentListQuerySchema = z.object({
  assetId: uuidSchema.optional(),

  userId: uuidSchema.optional(),

  status: assignmentStatusSchema.optional(),

  page: z
    .coerce
    .number()
    .int()
    .positive()
    .default(1),

  pageSize: z
    .coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(25),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

/**
 * ============================================================
 * ASSET CATEGORY
 * ============================================================
 */

export const createAssetCategorySchema = z.object({
  name: nonEmptyString.max(100),

  description: optionalString,
});

export const updateAssetCategorySchema = z.object({
  name: nonEmptyString.max(100).optional(),

  description: optionalString,

  isActive: z.boolean().optional(),
});

/**
 * ============================================================
 * ASSET STATUS
 * ============================================================
 */

export const createAssetStatusSchema = z.object({
  name: nonEmptyString.max(100),

  description: optionalString,

  isAssignable: z.boolean().default(true),

  isActive: z.boolean().default(true),
});

export const updateAssetStatusSchema = z.object({
  name: nonEmptyString.max(100).optional(),

  description: optionalString,

  isAssignable: z.boolean().optional(),

  isActive: z.boolean().optional(),
});

/**
 * ============================================================
 * INFERRED TYPES
 * ============================================================
 */

export type CreateAssetInput = z.infer<
  typeof createAssetSchema
>;

export type UpdateAssetInput = z.infer<
  typeof updateAssetSchema
>;

export type AssetListQuery = z.infer<
  typeof assetListQuerySchema
>;

export type AssignAssetInput = z.infer<
  typeof assignAssetSchema
>;

export type ReturnAssetInput = z.infer<
  typeof returnAssetSchema
>;

export type ReassignAssetInput = z.infer<
  typeof reassignAssetSchema
>;

export type AssignmentListQuery = z.infer<
  typeof assignmentListQuerySchema
>;

export type CreateAssetCategoryInput = z.infer<
  typeof createAssetCategorySchema
>;

export type UpdateAssetCategoryInput = z.infer<
  typeof updateAssetCategorySchema
>;

export type CreateAssetStatusInput = z.infer<
  typeof createAssetStatusSchema
>;

export type UpdateAssetStatusInput = z.infer<
  typeof updateAssetStatusSchema
>;
