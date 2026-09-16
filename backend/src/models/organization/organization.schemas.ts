import { z } from "zod";

const uuidSchema = z.string().uuid();

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional();

// ============================================================
// Company
// ============================================================

export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(255),

  legalName: optionalText(255),

  description: optionalText(5000),

  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .or(z.literal("").transform(() => null))
    .nullable()
    .optional(),

  phone: optionalText(50),

  website: z
    .string()
    .trim()
    .url()
    .max(500)
    .nullable()
    .optional(),

  addressLine1: optionalText(255),
  addressLine2: optionalText(255),
  city: optionalText(100),
  state: optionalText(100),
  postalCode: optionalText(30),
  country: optionalText(100),

  isActive: z
    .boolean()
    .default(true)
});

export const updateCompanySchema =
  createCompanySchema.partial();


// ============================================================
// Department
// ============================================================

export const createDepartmentSchema =
  z.object({
    companyId: uuidSchema,

    name: z
      .string()
      .trim()
      .min(1)
      .max(255),

    description: optionalText(5000),

    managerName: optionalText(255),

    email: z
      .string()
      .trim()
      .email()
    .max(320)
    .or(z.literal("").transform(() => null))
      .nullable()
      .optional(),

    isActive: z
      .boolean()
      .default(true)
  });

export const updateDepartmentSchema =
  createDepartmentSchema
    .omit({
      companyId: true
    })
    .partial();


// ============================================================
// Location
// ============================================================

export const createLocationSchema =
  z.object({
    companyId: uuidSchema,

    name: z
      .string()
      .trim()
      .min(1)
      .max(255),

    description: optionalText(5000),

    addressLine1: optionalText(255),
    addressLine2: optionalText(255),
    city: optionalText(100),
    state: optionalText(100),
    postalCode: optionalText(30),
    country: optionalText(100),

    building: optionalText(100),
    floor: optionalText(100),
    room: optionalText(100),

    isActive: z
      .boolean()
      .default(true)
  });

export const updateLocationSchema =
  createLocationSchema
    .omit({
      companyId: true
    })
    .partial();


// ============================================================
// Common
// ============================================================

export const organizationIdParamsSchema =
  z.object({
    id: uuidSchema
  });

export const organizationListQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),

    search: z
      .string()
      .trim()
      .max(200)
      .optional(),

    companyId: uuidSchema.optional(),

    isActive: z
      .enum(["true", "false"])
      .transform(
        (value) => value === "true"
      )
      .optional()
  });

export type CreateCompanyInput =
  z.infer<typeof createCompanySchema>;

export type UpdateCompanyInput =
  z.infer<typeof updateCompanySchema>;

export type CreateDepartmentInput =
  z.infer<typeof createDepartmentSchema>;

export type UpdateDepartmentInput =
  z.infer<typeof updateDepartmentSchema>;

export type CreateLocationInput =
  z.infer<typeof createLocationSchema>;

export type UpdateLocationInput =
  z.infer<typeof updateLocationSchema>;

export type OrganizationListQuery =
  z.infer<
    typeof organizationListQuerySchema
  >;