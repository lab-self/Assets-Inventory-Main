import { AppError } from "../../utils/errors.js";
import type { QueryResultRow } from "pg";

import {
  execute,
  executeWithAffectedRows as _executeWithAffectedRows,
  findMany,
  findOne,
  query,
  withTransaction,
} from "../../database/index.js";

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

/**
 * ============================================================
 * DATABASE ROW TYPES
 * ============================================================
 */

export interface AssetRow extends QueryResultRow {
  id: string;
  asset_tag: string;
  serial_number: string;
  category_id: string;
  status_id: string;
  company_id: string;
  department_id: string | null;
  location_id: string | null;

  manufacturer: string | null;
  model: string | null;

  purchase_date: string | null;
  purchase_cost: string | number | null;
  currency: string;

  warranty_start_date: string | null;
  warranty_end_date: string | null;

  vendor: string | null;
  invoice_number: string | null;

  condition: string;
  hostname: string | null;
  operating_system: string | null;
  cpu: string | null;
  ram_gb: number | null;

  storage_type: string | null;
  storage_capacity_gb: number | null;

  gpu: string | null;
  mac_address: string | null;
  ip_address: string | null;

  notes: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface AssetDetailsRow extends AssetRow {
  category_name: string;
  status_name: string;
  status_is_assignable: boolean;

  company_name: string;

  department_name: string | null;

  location_name: string | null;
}

export interface AssetAssignmentRow extends QueryResultRow {
  id: string;

  asset_id: string;
  user_id: string;

  assigned_at: string;
  returned_at: string | null;
  expected_return_at: string | null;

  status: string;

  condition_on_return: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;

  asset_tag: string;
  serial_number: string;

  employee_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

export interface AssetCategoryRow extends QueryResultRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetStatusRow extends QueryResultRow {
  id: string;
  name: string;
  description: string | null;
  is_assignable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at:string;
}

/**
 * ============================================================
 * ASSET SELECT
 * ============================================================
 */

const ASSET_SELECT = `
  SELECT
    a.id,
    a.asset_tag,
    a.serial_number,
    a.category_id,
    a.status_id,
    a.company_id,
    a.department_id,
    a.location_id,

    a.manufacturer,
    a.model,

    to_char(a.purchase_date, 'YYYY-MM-DD') AS purchase_date,
    a.purchase_cost,
    a.currency,

    to_char(a.warranty_start_date, 'YYYY-MM-DD') AS warranty_start_date,
    to_char(a.warranty_end_date, 'YYYY-MM-DD') AS warranty_end_date,

    a.vendor,
    a.invoice_number,

    a.condition,
    a.hostname,
    a.operating_system,
    a.cpu,
    a.ram_gb,

    a.storage_type,
    a.storage_capacity_gb,

    a.gpu,
    a.mac_address,
    a.ip_address,

    a.notes,

    a.is_active,

    a.created_at,
    a.updated_at,

    c.name AS category_name,

    s.name AS status_name,
    s.is_assignable AS status_is_assignable,

    co.name AS company_name,

    d.name AS department_name,

    l.name AS location_name

  FROM assets a

  INNER JOIN asset_categories c
    ON c.id = a.category_id

  INNER JOIN asset_statuses s
    ON s.id = a.status_id

  INNER JOIN companies co
    ON co.id = a.company_id

  LEFT JOIN departments d
    ON d.id = a.department_id

  LEFT JOIN locations l
    ON l.id = a.location_id
`;

/**
 * ============================================================
 * GET ASSET
 * ============================================================
 */

export async function getAssetById(
  assetId: string,
): Promise<AssetDetailsRow | null> {
  return findOne<AssetDetailsRow>(
    `
      ${ASSET_SELECT}
      WHERE a.id = $1
      LIMIT 1
    `,
    [assetId],
  );
}

/**
 * ============================================================
 * GET ASSET BY TAG
 * ============================================================
 */

export async function getAssetByTag(
  assetTag: string,
): Promise<AssetDetailsRow | null> {
  return findOne<AssetDetailsRow>(
    `
      ${ASSET_SELECT}
      WHERE LOWER(a.asset_tag) = LOWER($1)
      LIMIT 1
    `,
    [assetTag],
  );
}

/**
 * ============================================================
 * GET ASSET BY SERIAL NUMBER
 * ============================================================
 */

export async function getAssetBySerialNumber(
  serialNumber: string,
): Promise<AssetDetailsRow | null> {
  return findOne<AssetDetailsRow>(
    `
      ${ASSET_SELECT}
      WHERE LOWER(a.serial_number) = LOWER($1)
      LIMIT 1
    `,
    [serialNumber],
  );
}

/**
 * ============================================================
 * LIST ASSETS
 * ============================================================
 */

export async function findAssets(
  filters: AssetListQuery,
): Promise<{
  rows: AssetDetailsRow[];
  total: number;
}> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  let parameterIndex = 1;

  if (filters.search) {
    conditions.push(`
      (
        a.asset_tag ILIKE $${parameterIndex}
        OR a.serial_number ILIKE $${parameterIndex}
        OR COALESCE(a.manufacturer, '') ILIKE $${parameterIndex}
        OR COALESCE(a.model, '') ILIKE $${parameterIndex}
        OR COALESCE(a.hostname, '') ILIKE $${parameterIndex}
      )
    `);

    values.push(`%${filters.search}%`);
    parameterIndex++;
  }

  if (filters.assetTag) {
    conditions.push(
      `a.asset_tag ILIKE $${parameterIndex}`,
    );

    values.push(`%${filters.assetTag}%`);
    parameterIndex++;
  }

  if (filters.serialNumber) {
    conditions.push(
      `a.serial_number ILIKE $${parameterIndex}`,
    );

    values.push(`%${filters.serialNumber}%`);
    parameterIndex++;
  }

  if (filters.categoryId) {
    conditions.push(
      `a.category_id = $${parameterIndex}`,
    );

    values.push(filters.categoryId);
    parameterIndex++;
  }

  if (filters.statusId) {
    conditions.push(
      `a.status_id = $${parameterIndex}`,
    );

    values.push(filters.statusId);
    parameterIndex++;
  }

  if (filters.companyId) {
    conditions.push(
      `a.company_id = $${parameterIndex}`,
    );

    values.push(filters.companyId);
    parameterIndex++;
  }

  if (filters.departmentId) {
    conditions.push(
      `a.department_id = $${parameterIndex}`,
    );

    values.push(filters.departmentId);
    parameterIndex++;
  }

  if (filters.locationId) {
    conditions.push(
      `a.location_id = $${parameterIndex}`,
    );

    values.push(filters.locationId);
    parameterIndex++;
  }

  if (filters.condition) {
    conditions.push(
      `a.condition = $${parameterIndex}`,
    );

    values.push(filters.condition);
    parameterIndex++;
  }

  if (filters.isActive !== undefined) {
    conditions.push(
      `a.is_active = $${parameterIndex}`,
    );

    values.push(filters.isActive);
    parameterIndex++;
  }

  if (filters.assigned !== undefined) {
    if (filters.assigned) {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM asset_assignments aa
          WHERE aa.asset_id = a.id
            AND aa.status = 'assigned'
        )
      `);
    } else {
      conditions.push(`
        NOT EXISTS (
          SELECT 1
          FROM asset_assignments aa
          WHERE aa.asset_id = a.id
            AND aa.status = 'assigned'
        )
      `);
    }
  }

  if (filters.warrantyExpiring !== undefined) {
    if (filters.warrantyExpiring) {
      conditions.push(`
        a.warranty_end_date IS NOT NULL
        AND a.warranty_end_date >= CURRENT_DATE
        AND a.warranty_end_date <=
          CURRENT_DATE + INTERVAL '30 days'
      `);
    }
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const sortColumnMap: Record<string, string> = {
    assetTag: "LOWER(a.asset_tag)",
    hostname: "LOWER(a.hostname)",
    serialNumber: "a.serial_number",
    createdAt: "a.created_at",
    updatedAt: "a.updated_at",
    purchaseDate: "a.purchase_date",
    warrantyEndDate: "a.warranty_end_date",
  };

  const sortColumn =
    sortColumnMap[filters.sortBy] ??
    "a.created_at";

  const sortOrder =
    filters.sortOrder === "asc"
      ? "ASC"
      : "DESC";

  const offset =
    (filters.page - 1) * filters.pageSize;

  const dataValues = [
    ...values,
    filters.pageSize,
    offset,
  ];

  const limitParameter = parameterIndex;
  const offsetParameter = parameterIndex + 1;

  const rows = await query<AssetDetailsRow>(
    `
      ${ASSET_SELECT}
      ${whereClause}

      ORDER BY ${sortColumn} ${sortOrder}, LOWER(a.asset_tag) ASC, a.id ASC

      LIMIT $${limitParameter}
      OFFSET $${offsetParameter}
    `,
    dataValues,
  );

  const countResult = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM assets a
      ${whereClause}
    `,
    values,
  );

  return {
    rows: rows.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

/**
 * ============================================================
 * CREATE ASSET
 * ============================================================
 */

export async function insertAsset(
  input: CreateAssetInput,
): Promise<AssetDetailsRow> {
  return withTransaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `
        INSERT INTO assets (
          asset_tag,
          serial_number,
          category_id,
          status_id,
          company_id,
          department_id,
          location_id,

          manufacturer,
          model,

          purchase_date,
          purchase_cost,
          currency,

          warranty_start_date,
          warranty_end_date,

          vendor,
          invoice_number,

          condition,
          hostname,
          operating_system,
          cpu,
          ram_gb,

          storage_type,
          storage_capacity_gb,

          gpu,
          mac_address,
          ip_address,

          notes,
          is_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9,
          $10, $11, $12,
          $13, $14,
          $15, $16,
          $17, $18, $19, $20, $21,
          $22, $23,
          $24, $25, $26,
          $27, TRUE
        )
        RETURNING id
      `,
      [
        input.assetTag,
        input.serialNumber,
        input.categoryId,
        input.statusId,
        input.companyId,
        input.departmentId ?? null,
        input.locationId ?? null,

        input.manufacturer ?? null,
        input.model ?? null,

        input.purchaseDate ?? null,
        input.purchaseCost ?? null,
        input.currency,

        input.warrantyStartDate ?? null,
        input.warrantyEndDate ?? null,

        input.vendor ?? null,
        input.invoiceNumber ?? null,

        input.condition,
        input.hostname ?? null,
        input.operatingSystem ?? null,
        input.cpu ?? null,
        input.ramGb ?? null,

        input.storageType,
        input.storageCapacityGb ?? null,

        input.gpu ?? null,
        input.macAddress ?? null,
        input.ipAddress ?? null,

        input.notes ?? null,
      ],
    );

    const assetId = result.rows[0]?.id;

    if (!assetId) {
      throw new Error("Asset was created but no ID was returned");
    }

    const asset = await client.query<AssetDetailsRow>(
      `
        ${ASSET_SELECT}
        WHERE a.id = $1
        LIMIT 1
      `,
      [assetId],
    );

    const createdAsset = asset.rows[0];

    if (!createdAsset) {
      throw new Error(
        "Asset was created but could not be retrieved",
      );
    }

    return createdAsset;
  });
}

/**
 * ============================================================
 * UPDATE ASSET
 * ============================================================
 */

export async function updateAssetById(
  assetId: string,
  input: UpdateAssetInput,
): Promise<AssetDetailsRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  let parameterIndex = 1;

  const addField = (
    column: string,
    value: unknown,
  ): void => {
    fields.push(
      `${column} = $${parameterIndex}`,
    );

    values.push(value);
    parameterIndex++;
  };

  if (input.assetTag !== undefined) {
    addField("asset_tag", input.assetTag);
  }

  if (input.serialNumber !== undefined) {
    addField(
      "serial_number",
      input.serialNumber,
    );
  }

  if (input.categoryId !== undefined) {
    addField(
      "category_id",
      input.categoryId,
    );
  }

  if (input.statusId !== undefined) {
    addField(
      "status_id",
      input.statusId,
    );
  }

  if (input.companyId !== undefined) {
    addField(
      "company_id",
      input.companyId,
    );
  }

  if (input.departmentId !== undefined) {
    addField(
      "department_id",
      input.departmentId,
    );
  }

  if (input.locationId !== undefined) {
    addField(
      "location_id",
      input.locationId,
    );
  }

  if (input.manufacturer !== undefined) {
    addField(
      "manufacturer",
      input.manufacturer,
    );
  }

  if (input.model !== undefined) {
    addField("model", input.model);
  }

  if (input.purchaseDate !== undefined) {
    addField(
      "purchase_date",
      input.purchaseDate,
    );
  }

  if (input.purchaseCost !== undefined) {
    addField(
      "purchase_cost",
      input.purchaseCost,
    );
  }

  if (input.currency !== undefined) {
    addField("currency", input.currency);
  }

  if (input.warrantyStartDate !== undefined) {
    addField(
      "warranty_start_date",
      input.warrantyStartDate,
    );
  }

  if (input.warrantyEndDate !== undefined) {
    addField(
      "warranty_end_date",
      input.warrantyEndDate,
    );
  }

  if (input.vendor !== undefined) {
    addField("vendor", input.vendor);
  }

  if (input.invoiceNumber !== undefined) {
    addField(
      "invoice_number",
      input.invoiceNumber,
    );
  }

  if (input.condition !== undefined) {
    addField(
      "condition",
      input.condition,
    );
  }

  if (input.hostname !== undefined) {
    addField(
      "hostname",
      input.hostname,
    );
  }

  if (input.operatingSystem !== undefined) {
    addField(
      "operating_system",
      input.operatingSystem,
    );
  }

  if (input.cpu !== undefined) {
    addField("cpu", input.cpu);
  }

  if (input.ramGb !== undefined) {
    addField("ram_gb", input.ramGb);
  }

  if (input.storageType !== undefined) {
    addField(
      "storage_type",
      input.storageType,
    );
  }

  if (input.storageCapacityGb !== undefined) {
    addField(
      "storage_capacity_gb",
      input.storageCapacityGb,
    );
  }

  if (input.gpu !== undefined) {
    addField("gpu", input.gpu);
  }

  if (input.macAddress !== undefined) {
    addField(
      "mac_address",
      input.macAddress,
    );
  }

  if (input.ipAddress !== undefined) {
    addField(
      "ip_address",
      input.ipAddress,
    );
  }

  if (input.notes !== undefined) {
    addField("notes", input.notes);
  }

  if (input.isActive !== undefined) {
    addField(
      "is_active",
      input.isActive,
    );
  }

  if (fields.length === 0) {
    return getAssetById(assetId);
  }

  fields.push("updated_at = NOW()");

  values.push(assetId);

  await execute(
    `
      UPDATE assets
      SET ${fields.join(", ")}
      WHERE id = $${parameterIndex}
    `,
    values,
  );

  return getAssetById(assetId);
}

/**
 * ============================================================
 * ACTIVE ASSIGNMENT
 * ============================================================
 */

export async function getActiveAssignment(
  assetId: string,
): Promise<AssetAssignmentRow | null> {
  return findOne<AssetAssignmentRow>(
    `
      SELECT
        aa.id,
        aa.asset_id,
        aa.user_id,
        aa.assigned_at,
        aa.returned_at,
        aa.expected_return_at,
        aa.status,
        aa.condition_on_return,
        aa.notes,
        aa.created_at,
        aa.updated_at,

        a.asset_tag,
        a.serial_number,

        u.employee_id,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name

      FROM asset_assignments aa

      INNER JOIN assets a
        ON a.id = aa.asset_id

      INNER JOIN users u
        ON u.id = aa.user_id

      WHERE aa.asset_id = $1
        AND aa.status = 'assigned'

      LIMIT 1
    `,
    [assetId],
  );
}

/**
 * ============================================================
 * ASSIGN ASSET
 * ============================================================
 */

export async function createAssetAssignment(
  input: AssignAssetInput,
): Promise<AssetAssignmentRow> {
  return withTransaction(async (client) => {
    /*
     * Lock the asset row so concurrent assignments
     * cannot race each other.
     */
    const assetResult = await client.query<AssetDetailsRow>(
      `
        ${ASSET_SELECT}
        WHERE a.id = $1
        FOR UPDATE OF a
      `,
      [input.assetId],
    );

    const asset = assetResult.rows[0];

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (!asset.is_active) {
      throw new AppError("Inactive assets cannot be assigned", 400, "INACTIVE_ASSET");
    }

    /*
     * Lock/check the user.
     */
    const userResult = await client.query<{
      id: string;
      status: string;
    }>(
      `
        SELECT
          id,
          status
        FROM users
        WHERE id = $1
        FOR UPDATE
      `,
      [input.userId],
    );

    const user = userResult.rows[0];

    if (!user) {
      throw new AppError("User not found", 400, "USER_NOT_FOUND");
    }

    if (user.status !== "active") {
      throw new AppError("Only active users can receive assets", 400, "INACTIVE_USER",
      );
    }

    /*
     * Ensure asset does not already have an active assignment.
     */
    const activeAssignment = await client.query<{
      id: string;
    }>(
      `
        SELECT id
        FROM asset_assignments
        WHERE asset_id = $1
          AND status = 'assigned'
        LIMIT 1
      `,
      [input.assetId],
    );

    if (activeAssignment.rows.length > 0) {
      throw new AppError(
        "Asset is already assigned", 409, "ASSET_ALREADY_ASSIGNED",
      );
    }

    /*
     * Verify that the current asset status allows assignment.
     */
    if (!asset.status_is_assignable) {
      throw new Error(
        "Current asset status does not allow assignment",
      );
    }

    const assignmentResult =
      await client.query<{ id: string }>(
        `
          INSERT INTO asset_assignments (
            asset_id,
            user_id,
            assigned_at,
            expected_return_at,
            status,
            notes
          )
          VALUES (
            $1,
            $2,
            COALESCE($3::timestamptz, NOW()),
            $4,
            'assigned',
            $5
          )
          RETURNING id
        `,
        [
          input.assetId,
          input.userId,
          input.assignedDate ?? null,
          input.expectedReturnDate ?? null,
          input.notes ?? null,
        ],
      );

    const assignmentId =
      assignmentResult.rows[0]?.id;

    if (!assignmentId) {
      throw new Error(
        "Assignment was created but no ID was returned",
      );
    }

    /*
     * Keep the asset status consistent with its assignment.
     */
    await client.query(
      `
        UPDATE assets
        SET updated_at = NOW(),
            status_id = COALESCE((SELECT id FROM asset_statuses WHERE code = 'ASSIGNED' AND is_active = TRUE), status_id),
            assigned_date = COALESCE($2::timestamptz, NOW())::date
        WHERE id = $1
      `,
      [input.assetId, input.assignedDate ?? null],
    );

    const result =
      await client.query<AssetAssignmentRow>(
        `
          SELECT
            aa.id,
            aa.asset_id,
            aa.user_id,
            aa.assigned_at,
            aa.returned_at,
            aa.expected_return_at,
            aa.status,
            aa.condition_on_return,
            aa.notes,
            aa.created_at,
            aa.updated_at,

            a.asset_tag,
            a.serial_number,

            u.employee_id,
            u.email AS user_email,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name

          FROM asset_assignments aa

          INNER JOIN assets a
            ON a.id = aa.asset_id

          INNER JOIN users u
            ON u.id = aa.user_id

          WHERE aa.id = $1
          LIMIT 1
        `,
        [assignmentId],
      );

    const assignment = result.rows[0];

    if (!assignment) {
      throw new Error(
        "Assignment was created but could not be retrieved",
      );
    }

    return assignment;
  });
}

/**
 * ============================================================
 * RETURN ASSET
 * ============================================================
 */

export async function returnAssetAssignment(
  assetId: string,
  input: ReturnAssetInput,
): Promise<AssetAssignmentRow | null> {
  return withTransaction(async (client) => {
    const assignmentResult =
      await client.query<AssetAssignmentRow>(
        `
          SELECT
            aa.id,
            aa.asset_id,
            aa.user_id,
            aa.assigned_at,
            aa.returned_at,
            aa.expected_return_at,
            aa.status,
            aa.condition_on_return,
            aa.notes,
            aa.created_at,
            aa.updated_at,

            a.asset_tag,
            a.serial_number,

            u.employee_id,
            u.email AS user_email,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name

          FROM asset_assignments aa

          INNER JOIN assets a
            ON a.id = aa.asset_id

          INNER JOIN users u
            ON u.id = aa.user_id

          WHERE aa.asset_id = $1
            AND aa.status = 'assigned'

          FOR UPDATE OF aa

          LIMIT 1
        `,
        [assetId],
      );

    const assignment =
      assignmentResult.rows[0];

    if (!assignment) {
      return null;
    }

    const returnedAt =
      input.returnedDate ??
      new Date().toISOString();

    await client.query(
      `UPDATE assets SET
         status_id = COALESCE((SELECT id FROM asset_statuses WHERE code = CASE WHEN $2 = 'damaged' THEN 'DAMAGED' ELSE 'AVAILABLE' END AND is_active = TRUE), status_id),
         assigned_date = NULL, condition = COALESCE($2, condition), updated_at = NOW()
       WHERE id = $1`,
      [assetId, input.conditionOnReturn ?? null],
    );

    await client.query(
      `
        UPDATE asset_assignments
        SET
          returned_at = $1,
          status = 'returned',
          condition_on_return = $2,
          notes = COALESCE($3, notes),
          updated_at = NOW()
        WHERE id = $4
      `,
      [
        returnedAt,
        input.conditionOnReturn ?? null,
        input.notes ?? null,
        assignment.id,
      ],
    );

    const result =
      await client.query<AssetAssignmentRow>(
        `
          SELECT
            aa.id,
            aa.asset_id,
            aa.user_id,
            aa.assigned_at,
            aa.returned_at,
            aa.expected_return_at,
            aa.status,
            aa.condition_on_return,
            aa.notes,
            aa.created_at,
            aa.updated_at,

            a.asset_tag,
            a.serial_number,

            u.employee_id,
            u.email AS user_email,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name

          FROM asset_assignments aa

          INNER JOIN assets a
            ON a.id = aa.asset_id

          INNER JOIN users u
            ON u.id = aa.user_id

          WHERE aa.id = $1
          LIMIT 1
        `,
        [assignment.id],
      );

    return result.rows[0] ?? null;
  });
}

/**
 * ============================================================
 * REASSIGN ASSET
 * ============================================================
 */

export async function reassignAsset(
  assetId: string,
  input: ReassignAssetInput,
): Promise<AssetAssignmentRow> {
  return withTransaction(async (client) => {
    /*
     * Lock current assignment.
     */
    const currentResult =
      await client.query<AssetAssignmentRow>(
        `
          SELECT
            aa.id,
            aa.asset_id,
            aa.user_id,
            aa.assigned_at,
            aa.returned_at,
            aa.expected_return_at,
            aa.status,
            aa.condition_on_return,
            aa.notes,
            aa.created_at,
            aa.updated_at,

            a.asset_tag,
            a.serial_number,

            u.employee_id,
            u.email AS user_email,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name

          FROM asset_assignments aa

          INNER JOIN assets a
            ON a.id = aa.asset_id

          INNER JOIN users u
            ON u.id = aa.user_id

          WHERE aa.asset_id = $1
            AND aa.status = 'assigned'

          FOR UPDATE OF aa

          LIMIT 1
        `,
        [assetId],
      );

    const currentAssignment =
      currentResult.rows[0];

    if (!currentAssignment) {
      throw new Error(
        "Asset does not have an active assignment",
      );
    }

    /*
     * Lock and validate the new user.
     */
    const userResult = await client.query<{
      id: string;
      status: string;
    }>(
      `
        SELECT
          id,
          status
        FROM users
        WHERE id = $1
        FOR UPDATE
      `,
      [input.newUserId],
    );

    const user = userResult.rows[0];

    if (!user) {
      throw new AppError("New user not found", 400, "USER_NOT_FOUND");
    }

    if (user.status !== "active") {
      throw new AppError("Only active users can receive assets", 400, "INACTIVE_USER",
      );
    }

    /*
     * Close previous assignment.
     */
    await client.query(
      `
        UPDATE asset_assignments
        SET
          returned_at = COALESCE(returned_at, NOW()),
          status = 'returned',
          updated_at = NOW()
        WHERE id = $1
      `,
      [currentAssignment.id],
    );

    /*
     * Create new assignment.
     */
    const newAssignmentResult =
      await client.query<{ id: string }>(
        `
          INSERT INTO asset_assignments (
            asset_id,
            user_id,
            assigned_at,
            expected_return_at,
            status,
            notes
          )
          VALUES (
            $1,
            $2,
            COALESCE($3::timestamptz, NOW()),
            $4,
            'assigned',
            $5
          )
          RETURNING id
        `,
        [
          assetId,
          input.newUserId,
          input.assignedDate ?? null,
          input.expectedReturnDate ?? null,
          input.notes ?? null,
        ],
      );

    const newAssignmentId =
      newAssignmentResult.rows[0]?.id;

    if (!newAssignmentId) {
      throw new Error(
        "New assignment was created but no ID was returned",
      );
    }

    const result =
      await client.query<AssetAssignmentRow>(
        `
          SELECT
            aa.id,
            aa.asset_id,
            aa.user_id,
            aa.assigned_at,
            aa.returned_at,
            aa.expected_return_at,
            aa.status,
            aa.condition_on_return,
            aa.notes,
            aa.created_at,
            aa.updated_at,

            a.asset_tag,
            a.serial_number,

            u.employee_id,
            u.email AS user_email,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name

          FROM asset_assignments aa

          INNER JOIN assets a
            ON a.id = aa.asset_id

          INNER JOIN users u
            ON u.id = aa.user_id

          WHERE aa.id = $1
          LIMIT 1
        `,
        [newAssignmentId],
      );

    const assignment = result.rows[0];

    if (!assignment) {
      throw new Error(
        "New assignment could not be retrieved",
      );
    }

    return assignment;
  });
}

/**
 * ============================================================
 * ASSIGNMENT HISTORY
 * ============================================================
 */

export async function findAssignments(
  filters: AssignmentListQuery,
): Promise<{
  rows: AssetAssignmentRow[];
  total: number;
}> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  let parameterIndex = 1;

  if (filters.assetId) {
    conditions.push(
      `aa.asset_id = $${parameterIndex}`,
    );

    values.push(filters.assetId);
    parameterIndex++;
  }

  if (filters.userId) {
    conditions.push(
      `aa.user_id = $${parameterIndex}`,
    );

    values.push(filters.userId);
    parameterIndex++;
  }

  if (filters.status) {
    conditions.push(
      `aa.status = $${parameterIndex}`,
    );

    values.push(filters.status);
    parameterIndex++;
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const sortOrder =
    filters.sortOrder === "asc"
      ? "ASC"
      : "DESC";

  const offset =
    (filters.page - 1) * filters.pageSize;

  const rows = await query<AssetAssignmentRow>(
    `
      SELECT
        aa.id,
        aa.asset_id,
        aa.user_id,
        aa.assigned_at,
        aa.returned_at,
        aa.expected_return_at,
        aa.status,
        aa.condition_on_return,
        aa.notes,
        aa.created_at,
        aa.updated_at,

        a.asset_tag,
        a.serial_number,

        u.employee_id,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name

      FROM asset_assignments aa

      INNER JOIN assets a
        ON a.id = aa.asset_id

      INNER JOIN users u
        ON u.id = aa.user_id

      ${whereClause}

      ORDER BY aa.assigned_at ${sortOrder}

      LIMIT $${parameterIndex}
      OFFSET $${parameterIndex + 1}
    `,
    [
      ...values,
      filters.pageSize,
      offset,
    ],
  );

  const countResult = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM asset_assignments aa
      ${whereClause}
    `,
    values,
  );

  return {
    rows: rows.rows,
    total: Number(
      countResult.rows[0]?.count ?? 0,
    ),
  };
}

/**
 * ============================================================
 * ASSET CATEGORIES
 * ============================================================
 */

export async function getAssetCategoryById(
  id: string,
): Promise<AssetCategoryRow | null> {
  return findOne<AssetCategoryRow>(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM asset_categories
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
}

export async function getAssetCategories(): Promise<
  AssetCategoryRow[]
> {
  return findMany<AssetCategoryRow>(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM asset_categories
      WHERE is_active = TRUE
      ORDER BY name ASC
    `,
  );
}

export async function insertAssetCategory(
  input: CreateAssetCategoryInput,
): Promise<AssetCategoryRow> {
  const result = await query<AssetCategoryRow>(
    `
      INSERT INTO asset_categories (
        name,
        code,
        description,
        is_active
      )
      VALUES ($1, gen_random_uuid()::text, $2, TRUE)

      RETURNING
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [
      input.name,
      input.description ?? null,
    ],
  );

  const category = result.rows[0];

  if (!category) {
    throw new Error(
      "Asset category was created but no row was returned",
    );
  }

  return category;
}

export async function updateAssetCategoryById(
  id: string,
  input: UpdateAssetCategoryInput,
): Promise<AssetCategoryRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  let parameterIndex = 1;

  if (input.name !== undefined) {
    fields.push(
      `name = $${parameterIndex}`,
    );
    values.push(input.name);
    parameterIndex++;
  }

  if (input.description !== undefined) {
    fields.push(
      `description = $${parameterIndex}`,
    );
    values.push(input.description);
    parameterIndex++;
  }

  if (input.isActive !== undefined) {
    fields.push(
      `is_active = $${parameterIndex}`,
    );
    values.push(input.isActive);
    parameterIndex++;
  }

  if (fields.length === 0) {
    return getAssetCategoryById(id);
  }

  fields.push("updated_at = NOW()");
  values.push(id);

  await execute(
    `
      UPDATE asset_categories
      SET ${fields.join(", ")}
      WHERE id = $${parameterIndex}
    `,
    values,
  );

  return getAssetCategoryById(id);
}

/**
 * ============================================================
 * ASSET STATUSES
 * ============================================================
 */

export async function getAssetStatusById(
  id: string,
): Promise<AssetStatusRow | null> {
  return findOne<AssetStatusRow>(
    `
      SELECT
        id,
        name,
        description,
        is_assignable,
        is_active,
        created_at,
        updated_at
      FROM asset_statuses
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
}

export async function getAssetStatuses(): Promise<
  AssetStatusRow[]
> {
  return findMany<AssetStatusRow>(
    `
      SELECT
        id,
        name,
        description,
        is_assignable,
        is_active,
        created_at,
        updated_at
      FROM asset_statuses
      WHERE is_active = TRUE
      ORDER BY name ASC
    `,
  );
}

export async function insertAssetStatus(
  input: CreateAssetStatusInput,
): Promise<AssetStatusRow> {
  const result = await query<AssetStatusRow>(
    `
      INSERT INTO asset_statuses (
        name,
        code,
        description,
        is_assignable,
        is_active
      )
      VALUES ($1, gen_random_uuid()::text, $2, $3, $4)

      RETURNING
        id,
        name,
        description,
        is_assignable,
        is_active,
        created_at,
        updated_at
    `,
    [
      input.name,
      input.description ?? null,
      input.isAssignable,
      input.isActive,
    ],
  );

  const status = result.rows[0];

  if (!status) {
    throw new Error(
      "Asset status was created but no row was returned",
    );
  }

  return status;
}

export async function updateAssetStatusById(
  id: string,
  input: UpdateAssetStatusInput,
): Promise<AssetStatusRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  let parameterIndex = 1;

  if (input.name !== undefined) {
    fields.push(
      `name = $${parameterIndex}`,
    );
    values.push(input.name);
    parameterIndex++;
  }

  if (input.description !== undefined) {
    fields.push(
      `description = $${parameterIndex}`,
    );
    values.push(input.description);
    parameterIndex++;
  }

  if (input.isAssignable !== undefined) {
    fields.push(
      `is_assignable = $${parameterIndex}`,
    );
    values.push(input.isAssignable);
    parameterIndex++;
  }

  if (input.isActive !== undefined) {
    fields.push(
      `is_active = $${parameterIndex}`,
    );
    values.push(input.isActive);
    parameterIndex++;
  }

  if (fields.length === 0) {
    return getAssetStatusById(id);
  }

  fields.push("updated_at = NOW()");
  values.push(id);

  await execute(
    `
      UPDATE asset_statuses
      SET ${fields.join(", ")}
      WHERE id = $${parameterIndex}
    `,
    values,
  );

  return getAssetStatusById(id);
}
