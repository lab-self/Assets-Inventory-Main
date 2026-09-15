import { z } from "zod";

const uuidSchema = z.string().uuid();

const optionalUuid = uuidSchema.nullable().optional();

const optionalText = (
  maxLength: number
) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional();

export const createUserSchema = z.object({
  companyId: optionalUuid,

  departmentId: optionalUuid,

  locationId: optionalUuid,

  employeeId: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  firstName: z
    .string()
    .trim()
    .min(1)
    .max(100),

  lastName: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  email: z
    .string()
    .trim()
    .email()
    .max(320),

  phone: optionalText(50),

  password: z
    .string()
    .min(12)
    .max(128),

  jobTitle: optionalText(150),

  status: z
    .enum([
      "active",
      "inactive",
      "suspended",
      "locked"
    ])
    .default("active"),

  isSuperAdmin: z
    .boolean()
    .default(false),

  roleIds: z
    .array(uuidSchema)
    .default([])
});

export const updateUserSchema = z.object({
  companyId: optionalUuid,

  departmentId: optionalUuid,

  locationId: optionalUuid,

  employeeId: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  firstName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  lastName: optionalText(100),

  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .optional(),

  phone: optionalText(50),

  jobTitle: optionalText(150),

  status: z
    .enum([
      "active",
      "inactive",
      "suspended",
      "locked"
    ])
    .optional(),

  isSuperAdmin: z
    .boolean()
    .optional(),

  roleIds: z
    .array(uuidSchema)
    .optional()
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(12)
    .max(128)
});

export const userIdParamsSchema = z.object({
  id: uuidSchema
});

export const userListQuerySchema = z.object({
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

  status: z
    .enum([
      "active",
      "inactive",
      "suspended",
      "locked"
    ])
    .optional(),

  companyId: uuidSchema.optional(),

  departmentId: uuidSchema.optional(),

  locationId: uuidSchema.optional()
});

export type CreateUserInput =
  z.infer<typeof createUserSchema>;

export type UpdateUserInput =
  z.infer<typeof updateUserSchema>;

export type UpdatePasswordInput =
  z.infer<typeof updatePasswordSchema>;

export type UserListQuery =
  z.infer<typeof userListQuerySchema>;