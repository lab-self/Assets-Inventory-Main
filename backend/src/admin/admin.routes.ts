import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import ExcelJS from "exceljs";

import { query } from "../database/index.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { AppError } from "../utils/errors.js";

const uuid = z.string().uuid();
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().max(200).optional(),
  action: z.string().trim().max(100).optional(),
});
const optionalText = z.string().trim().min(1).max(500).nullable().optional();

const autodeskCreateSchema = z.object({
  userId: uuid.nullable().optional(),
  autodeskEmail: z.union([z.string().trim().email(), z.literal("").transform(() => null)]).nullable().optional(),
  licenseType: z.enum(["aec", "forma", "autocad", "revit", "maya", "3ds_max", "civil_3d", "fusion", "collaboration", "other"]).default("other"),
  licenseStatus: z.string().trim().min(1).max(30).default("unassigned"),
  licenseIdentifier: optionalText,
  assignedDate: z.string().date().nullable().optional(),
  expiryDate: z.string().date().nullable().optional(),
  credentialSecretRef: z.string().trim().max(500).nullable().optional(),
  notes: optionalText,
});

const autodeskUpdateSchema = autodeskCreateSchema.partial();

const teamsCreateSchema = z.object({
  userId: uuid,
  teamsEmail: z.string().email(),
  accountStatus: z.string().trim().min(1).max(30).default("active"),
  assignedDate: z.string().date().nullable().optional(),
  disabledDate: z.string().date().nullable().optional(),
  notes: optionalText,
});

const teamsUpdateSchema = teamsCreateSchema.partial();

const settingCreateSchema = z.object({
  settingKey: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(50).default("general"),
  settingValue: z.unknown(),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().default(true),
});

const settingUpdateSchema = settingCreateSchema.partial();

function auditRequest(request: FastifyRequest) {
  return {
    userId: request.authenticatedUser?.id ?? null,
    ipAddress: request.ip || null,
    userAgent: request.headers["user-agent"] ?? null,
  };
}

async function writeAudit(
  request: FastifyRequest,
  action: string,
  entityType: string,
  entityId: string | null,
  previousValues: unknown = null,
  newValues: unknown = null,
): Promise<void> {
  const meta = auditRequest(request);
  await query(
    `
      INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        ip_address,
        user_agent,
        previous_values,
        new_values
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      meta.userId,
      action,
      entityType,
      entityId,
      meta.ipAddress,
      meta.userAgent,
      previousValues,
      newValues,
    ],
  );
}

async function ensureUserExists(userId: string): Promise<void> {
  const result = await query<{ id: string }>(
    "SELECT id FROM users WHERE id = $1 AND status = 'active' LIMIT 1",
    [userId],
  );
  if (!result.rows[0]) {
    throw new AppError("Active employee/user was not found.", 400, "USER_NOT_FOUND");
  }
}

async function updateDynamic(
  table: string,
  id: string,
  values: Record<string, unknown>,
  returning = "*",
): Promise<Record<string, unknown> | null> {
  const allowedColumns = new Set([
    "user_id", "autodesk_email", "license_type", "license_status",
    "license_identifier", "assigned_date", "expiry_date", "credential_secret_ref",
    "notes", "account_status", "teams_email", "disabled_date", "is_active",
    "setting_key", "category", "setting_value", "description", "updated_by",
  ]);

  const entries = Object.entries(values).filter(
    ([key, value]) => allowedColumns.has(key) && value !== undefined,
  );

  if (entries.length === 0) return null;

  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`);
  const params = entries.map(([key, value]) => key === "setting_value" ? JSON.stringify(value) : value);
  params.push(id);

  const result = await query<Record<string, unknown>>(
    `UPDATE ${table} SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING ${returning}`,
    params,
  );

  return result.rows[0] ?? null;
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const auth = [authenticate];

  // ============================================================
  // Dashboard
  // ============================================================
  app.get("/dashboard/summary", { preHandler: [...auth, requirePermission("dashboard.read")] }, async () => {
    const result = await query<Record<string, string>>(`
      SELECT
        (SELECT COUNT(*)::text FROM assets WHERE is_active = TRUE) AS total_assets,
        (SELECT COUNT(*)::text FROM asset_assignments WHERE status = 'assigned') AS assigned_assets,
        (SELECT COUNT(*)::text FROM assets a JOIN asset_statuses s ON s.id = a.status_id WHERE a.is_active = TRUE AND LOWER(s.name) IN ('in stock','free','available')) AS stock_assets,
        (SELECT COUNT(*)::text FROM assets a JOIN asset_statuses s ON s.id = a.status_id WHERE a.is_active = TRUE AND LOWER(s.name) IN ('faulty','under repair','repair')) AS faulty_assets,
        (SELECT COUNT(*)::text FROM companies WHERE is_active = TRUE) AS total_companies,
        (SELECT COUNT(*)::text FROM departments WHERE is_active = TRUE) AS total_departments,
        (SELECT COUNT(*)::text FROM users WHERE status = 'active') AS total_users,
        (SELECT COUNT(*)::text FROM autodesk_licenses WHERE is_active = TRUE) AS total_autodesk,
        (SELECT COUNT(*)::text FROM autodesk_licenses WHERE is_active = TRUE AND license_status = 'assigned') AS assigned_autodesk,
        (SELECT COUNT(*)::text FROM autodesk_licenses WHERE is_active = TRUE AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_licenses,
        (SELECT COUNT(*)::text FROM assets WHERE is_active = TRUE AND warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_warranties,
        (SELECT COUNT(*)::text FROM teams_accounts WHERE is_active = TRUE) AS teams_accounts,
        (SELECT COUNT(*)::text FROM assets a WHERE a.is_active = TRUE AND NOT EXISTS (SELECT 1 FROM asset_assignments aa WHERE aa.asset_id = a.id AND aa.status = 'assigned' AND aa.returned_at IS NULL)) AS unassigned_assets
    `);

    const byType = await query<{ name: string; count: string }>(`
      SELECT c.name, COUNT(*)::text AS count
      FROM assets a
      JOIN asset_categories c ON c.id = a.category_id
      WHERE a.is_active = TRUE
      GROUP BY c.name ORDER BY COUNT(*) DESC, c.name
    `);

    const byStatus = await query<{ name: string; count: string }>(`
      SELECT s.name, COUNT(*)::text AS count
      FROM assets a
      JOIN asset_statuses s ON s.id = a.status_id
      WHERE a.is_active = TRUE
      GROUP BY s.name ORDER BY COUNT(*) DESC, s.name
    `);

    const recent = await query<Record<string, unknown>>(`
      SELECT id, action, entity_type, entity_id, created_at
      FROM audit_logs ORDER BY created_at DESC LIMIT 10
    `);

    const row = result.rows[0] ?? {};
    return {
      totals: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value ?? 0)])),
      byType: byType.rows.map((item) => ({ name: item.name, count: Number(item.count) })),
      byStatus: byStatus.rows.map((item) => ({ name: item.name, count: Number(item.count) })),
      recentActivity: recent.rows,
    };
  });

  // ============================================================
  // Autodesk
  // ============================================================
  app.get("/autodesk", { preHandler: [...auth, requirePermission("autodesk.read")] }, async (request) => {
    const q = listQuerySchema.parse(request.query);
    const { page, pageSize } = q;
    const search = q.search?.trim() || "";
    const result = await query<Record<string, unknown>>(`
      SELECT a.id, a.user_id, a.autodesk_email, a.license_type, a.license_status,
             a.license_identifier, to_char(a.assigned_date, 'YYYY-MM-DD') AS assigned_date, to_char(a.expiry_date, 'YYYY-MM-DD') AS expiry_date, a.vendor_name,
             a.credential_secret_ref, a.notes, a.is_active,
             u.employee_id, CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name
      FROM autodesk_licenses a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.is_active = TRUE
        AND ($1 = '' OR a.autodesk_email ILIKE '%' || $1 || '%' OR a.license_identifier ILIKE '%' || $1 || '%' OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%')
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `, [search, pageSize, (page - 1) * pageSize]);
    const count = await query<{ count: string }>(`
      SELECT COUNT(*)::text AS count FROM autodesk_licenses a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.is_active = TRUE
        AND ($1 = '' OR a.autodesk_email ILIKE '%' || $1 || '%' OR a.license_identifier ILIKE '%' || $1 || '%' OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%')
    `, [search]);
    return { rows: result.rows, total: Number(count.rows[0]?.count ?? 0), page, pageSize };
  });

  app.post("/autodesk", { preHandler: [...auth, requirePermission("autodesk.create")] }, async (request, reply) => {
    const input = autodeskCreateSchema.parse(request.body);
    if (input.userId) await ensureUserExists(input.userId);
    if (input.expiryDate && input.assignedDate && input.expiryDate < input.assignedDate) {
      throw new AppError("License expiry cannot be before assignment date.", 400, "INVALID_LICENSE_DATES");
    }
    const result = await query<Record<string, unknown>>(`
      INSERT INTO autodesk_licenses
        (user_id, autodesk_email, license_type, license_status, license_identifier, assigned_date, expiry_date, credential_secret_ref, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [input.userId ?? null, input.autodeskEmail ?? null, input.licenseType, input.licenseStatus, input.licenseIdentifier ?? null, input.assignedDate ?? null, input.expiryDate ?? null, input.credentialSecretRef ?? null, input.notes ?? null]);
    await writeAudit(request, "CREATE", "AUTODESK_LICENSE", String(result.rows[0]?.id), null, { licenseType: input.licenseType, licenseStatus: input.licenseStatus, userId: input.userId ?? null });
    return reply.code(201).send(result.rows[0]);
  });

  app.patch("/autodesk/:id", { preHandler: [...auth, requirePermission("autodesk.update")] }, async (request) => {
    const id = uuid.parse((request.params as { id: string }).id);
    const input = autodeskUpdateSchema.parse(request.body);
    if (input.userId) await ensureUserExists(input.userId);
    const previous = await query<Record<string, unknown>>("SELECT * FROM autodesk_licenses WHERE id = $1 AND is_active = TRUE", [id]);
    if (!previous.rows[0]) throw new AppError("Autodesk license not found.", 404, "AUTODESK_NOT_FOUND");
    const row = await updateDynamic("autodesk_licenses", id, {
      user_id: input.userId, autodesk_email: input.autodeskEmail, license_type: input.licenseType,
      license_status: input.licenseStatus, license_identifier: input.licenseIdentifier,
      assigned_date: input.assignedDate, expiry_date: input.expiryDate,
      credential_secret_ref: input.credentialSecretRef, notes: input.notes,
    });
    await writeAudit(request, "UPDATE", "AUTODESK_LICENSE", id, previous.rows[0], row);
    return row;
  });

  app.delete("/autodesk/:id", { preHandler: [...auth, requirePermission("autodesk.delete")] }, async (request) => {
    const id = uuid.parse((request.params as { id: string }).id);
    const previous = await query<Record<string, unknown>>("SELECT id, license_status, user_id FROM autodesk_licenses WHERE id = $1 AND is_active = TRUE", [id]);
    if (!previous.rows[0]) throw new AppError("Autodesk license not found.", 404, "AUTODESK_NOT_FOUND");
    await query("UPDATE autodesk_licenses SET is_active = FALSE, license_status = 'cancelled', updated_at = NOW() WHERE id = $1", [id]);
    await writeAudit(request, "DELETE", "AUTODESK_LICENSE", id, previous.rows[0], null);
    return { success: true, message: "Autodesk license deactivated successfully." };
  });

  // ============================================================
  // Microsoft Teams
  // ============================================================
  app.get("/teams", { preHandler: [...auth, requirePermission("teams.read")] }, async (request) => {
    const q = listQuerySchema.parse(request.query);
    const { page, pageSize } = q;
    const search = q.search?.trim() || "";
    const result = await query<Record<string, unknown>>(`
      SELECT t.id, t.user_id, t.teams_email, t.account_status, to_char(t.assigned_date, 'YYYY-MM-DD') AS assigned_date, to_char(t.disabled_date, 'YYYY-MM-DD') AS disabled_date, t.notes,
             u.employee_id, CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name
      FROM teams_accounts t JOIN users u ON u.id = t.user_id
      WHERE t.is_active = TRUE
        AND ($1 = '' OR t.teams_email ILIKE '%' || $1 || '%' OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%')
      ORDER BY t.created_at DESC LIMIT $2 OFFSET $3
    `, [search, pageSize, (page - 1) * pageSize]);
    const count = await query<{ count: string }>(`
      SELECT COUNT(*)::text AS count FROM teams_accounts t JOIN users u ON u.id = t.user_id
      WHERE t.is_active = TRUE AND ($1 = '' OR t.teams_email ILIKE '%' || $1 || '%' OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE '%' || $1 || '%')
    `, [search]);
    return { rows: result.rows, total: Number(count.rows[0]?.count ?? 0), page, pageSize };
  });

  app.post("/teams", { preHandler: [...auth, requirePermission("teams.create")] }, async (request, reply) => {
    const input = teamsCreateSchema.parse(request.body);
    await ensureUserExists(input.userId);
    if (input.assignedDate && input.disabledDate && input.disabledDate < input.assignedDate) {
      throw new AppError("Disabled date cannot be before assigned date.", 400, "INVALID_TEAMS_DATES");
    }
    const result = await query<Record<string, unknown>>(`
      INSERT INTO teams_accounts (user_id, teams_email, account_status, assigned_date, disabled_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [input.userId, input.teamsEmail, input.accountStatus, input.assignedDate ?? null, input.disabledDate ?? null, input.notes ?? null]);
    await writeAudit(request, "CREATE", "TEAMS_ACCOUNT", String(result.rows[0]?.id), null, { userId: input.userId, teamsEmail: input.teamsEmail, accountStatus: input.accountStatus });
    return reply.code(201).send(result.rows[0]);
  });

  app.patch("/teams/:id", { preHandler: [...auth, requirePermission("teams.update")] }, async (request) => {
    const id = uuid.parse((request.params as { id: string }).id);
    const input = teamsUpdateSchema.parse(request.body);
    if (input.userId) await ensureUserExists(input.userId);
    const previous = await query<Record<string, unknown>>("SELECT * FROM teams_accounts WHERE id = $1 AND is_active = TRUE", [id]);
    if (!previous.rows[0]) throw new AppError("Teams account not found.", 404, "TEAMS_NOT_FOUND");
    const row = await updateDynamic("teams_accounts", id, {
      user_id: input.userId, teams_email: input.teamsEmail, account_status: input.accountStatus,
      assigned_date: input.assignedDate, disabled_date: input.disabledDate, notes: input.notes,
    });
    await writeAudit(request, "UPDATE", "TEAMS_ACCOUNT", id, previous.rows[0], row);
    return row;
  });

  app.delete("/teams/:id", { preHandler: [...auth, requirePermission("teams.delete")] }, async (request) => {
    const id = uuid.parse((request.params as { id: string }).id);
    const previous = await query<Record<string, unknown>>("SELECT id, account_status, user_id FROM teams_accounts WHERE id = $1 AND is_active = TRUE", [id]);
    if (!previous.rows[0]) throw new AppError("Teams account not found.", 404, "TEAMS_NOT_FOUND");
    await query("UPDATE teams_accounts SET is_active = FALSE, account_status = 'disabled', disabled_date = COALESCE(disabled_date, CURRENT_DATE), updated_at = NOW() WHERE id = $1", [id]);
    await writeAudit(request, "DELETE", "TEAMS_ACCOUNT", id, previous.rows[0], null);
    return { success: true, message: "Teams account deactivated successfully." };
  });

  // ============================================================
  // Settings
  // ============================================================
  app.get("/settings", { preHandler: [...auth, requirePermission("settings.read")] }, async () => {
    const result = await query<Record<string, unknown>>(`SELECT id, setting_key, category, setting_value, description, is_active, updated_by, updated_at FROM settings ORDER BY category, setting_key`);
    return result.rows;
  });

  app.post("/settings", { preHandler: [...auth, requirePermission("settings.create")] }, async (request, reply) => {
    const input = settingCreateSchema.parse(request.body);
    const result = await query<Record<string, unknown>>(`
      INSERT INTO settings (setting_key, category, setting_value, description, is_active, updated_by)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, setting_key, category, setting_value, description, is_active, updated_by, updated_at
    `, [input.settingKey, input.category, JSON.stringify(input.settingValue), input.description ?? null, input.isActive, request.authenticatedUser?.id ?? null]);
    await writeAudit(request, "CREATE", "SETTING", String(result.rows[0]?.id), null, { settingKey: input.settingKey, category: input.category });
    return reply.code(201).send(result.rows[0]);
  });

  app.patch("/settings/:id", { preHandler: [...auth, requirePermission("settings.update")] }, async (request) => {
    const id = uuid.parse((request.params as { id: string }).id);
    const input = settingUpdateSchema.parse(request.body);
    const previous = await query<Record<string, unknown>>("SELECT * FROM settings WHERE id = $1", [id]);
    if (!previous.rows[0]) throw new AppError("Setting not found.", 404, "SETTING_NOT_FOUND");
    const row = await updateDynamic("settings", id, {
      setting_key: input.settingKey, category: input.category, setting_value: input.settingValue,
      description: input.description, is_active: input.isActive, updated_by: request.authenticatedUser?.id ?? null,
    });
    await writeAudit(request, "SETTINGS_CHANGE", "SETTING", id, previous.rows[0], row);
    return row;
  });

  app.delete("/settings/:id", { preHandler: [...auth, requirePermission("settings.delete")] }, async (request) => {
    const id = uuid.parse((request.params as { id: string }).id);
    const previous = await query<Record<string, unknown>>("SELECT * FROM settings WHERE id = $1", [id]);
    if (!previous.rows[0]) throw new AppError("Setting not found.", 404, "SETTING_NOT_FOUND");
    await query("UPDATE settings SET is_active = FALSE, updated_at = NOW(), updated_by = $2 WHERE id = $1", [id, request.authenticatedUser?.id ?? null]);
    await writeAudit(request, "DELETE", "SETTING", id, previous.rows[0], null);
    return { success: true, message: "Setting deactivated successfully." };
  });

  // ============================================================
  // Reports / Excel export
  // ============================================================
  app.get("/reports/assets", { preHandler: [...auth, requirePermission("reports.read")] }, async () => {
    const result = await query<Record<string, unknown>>(`
      SELECT a.asset_tag, a.hostname, c.name AS device_type, a.serial_number,
             a.cpu, a.ram_gb, a.storage_type, a.storage_capacity_gb,
             a.gpu, a.graphics_memory_gb, a.antivirus, s.name AS status,
             co.name AS company, l.name AS location, a.purchase_date,
             a.assigned_date, a.warranty_end_date AS warranty_expiry,
             a.vendor, a.notes
      FROM assets a
      JOIN asset_categories c ON c.id = a.category_id
      JOIN asset_statuses s ON s.id = a.status_id
      LEFT JOIN companies co ON co.id = a.company_id
      LEFT JOIN locations l ON l.id = a.location_id
      WHERE a.is_active = TRUE ORDER BY a.created_at DESC
    `);
    return result.rows;
  });

  app.get("/reports/assets/export", { preHandler: [...auth, requirePermission("reports.export")] }, async (_request, reply) => {
    const result = await query<Record<string, unknown>>(`
      SELECT a.asset_tag AS "Asset Tag", a.hostname AS "Hostname", c.name AS "Device Type", a.serial_number AS "Serial Number",
             a.cpu AS "Processor", a.ram_gb AS "RAM (GB)", a.storage_type AS "Storage Type", a.storage_capacity_gb AS "Storage (GB)",
             a.gpu AS "GPU", a.graphics_memory_gb AS "Graphics Memory (GB)", a.antivirus AS "Antivirus", s.name AS "Status",
             co.name AS "Company", l.name AS "Location", a.purchase_date AS "Purchase Date", a.assigned_date AS "Assigned Date",
             a.warranty_end_date AS "Warranty Expiry", a.vendor AS "Vendor", a.notes AS "Remarks"
      FROM assets a JOIN asset_categories c ON c.id = a.category_id JOIN asset_statuses s ON s.id = a.status_id
      LEFT JOIN companies co ON co.id = a.company_id LEFT JOIN locations l ON l.id = a.location_id
      WHERE a.is_active = TRUE ORDER BY a.created_at DESC
    `);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Inventory Management";
    const sheet = workbook.addWorksheet("Assets");
    const rows = result.rows;
    if (rows.length > 0) {
      const headers = Object.keys(rows[0] ?? {});
      sheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(14, Math.min(28, header.length + 4)) }));
      for (const row of rows) sheet.addRow(row);
      sheet.getRow(1).font = { bold: true };
      sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + Math.min(headers.length, 26))}1` };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
    }
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    await writeAudit(_request, "EXPORT", "ASSET_REPORT", null, null, { rows: rows.length, format: "xlsx" });
    return reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("Content-Disposition", `attachment; filename="inventory-assets-${new Date().toISOString().slice(0, 10)}.xlsx"`)
      .send(buffer);
  });

  app.get("/reports/users", { preHandler: [...auth, requirePermission("reports.read")] }, async () => {
    const result = await query<Record<string, unknown>>(`
      SELECT u.employee_id, CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name,
             co.name AS company, d.name AS department, u.email, u.job_title, u.status
      FROM users u LEFT JOIN companies co ON co.id = u.company_id LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  });

  app.get("/reports/licenses", { preHandler: [...auth, requirePermission("reports.read")] }, async () => {
    const result = await query<Record<string, unknown>>(`
      SELECT a.license_identifier, a.autodesk_email, a.license_type, a.license_status,
             CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name, a.assigned_date, a.expiry_date
      FROM autodesk_licenses a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.is_active = TRUE ORDER BY a.expiry_date NULLS LAST
    `);
    return result.rows;
  });

  app.get("/audit-logs", { preHandler: [...auth, requirePermission("audit.read")] }, async (request) => {
    const q = listQuerySchema.parse(request.query);
    const { page, pageSize } = q;
    const result = await query<Record<string, unknown>>(`
      SELECT al.id, al.action, al.entity_type, al.entity_id, al.ip_address, al.user_agent, al.created_at,
             CONCAT_WS(' ', u.first_name, u.last_name) AS user_name, u.email
      FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
      WHERE ($1 = '' OR al.action = $1)
      ORDER BY al.created_at DESC LIMIT $2 OFFSET $3
    `, [q.action?.trim() || "", pageSize, (page - 1) * pageSize]);
    return result.rows;
  });
}
