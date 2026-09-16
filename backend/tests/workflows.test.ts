import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";

const state = vi.hoisted(() => ({ db: null as PGlite | null }));
vi.mock("../src/config/env.js", () => ({ env: {
  JWT_EXPIRES_IN: "15m", JWT_REFRESH_EXPIRES_IN: "7d",
  JWT_REFRESH_SECRET: "test-refresh-secret-with-at-least-32-characters",
  LOG_LEVEL: "silent", LOG_FORMAT: "json",
} }));
vi.mock("../src/config/database.js", async () => {
  const { createRequire } = await import("node:module");
  const { prepareValue } = createRequire(import.meta.url)("pg/lib/utils");
  const query = async (sql: string, values: unknown[] = []) => {
    const result = await state.db!.query(sql, values.map((value) => prepareValue(value)));
    return { ...result, rowCount: result.affectedRows ?? result.rows.length };
  };
  return { databasePool: { query, connect: async () => ({ query, release() {} }) } };
});

import { authRoutes } from "../src/auth/auth.routes.js";
import { organizationRoutes } from "../src/models/organization/organization.routes.js";
import { userRoutes } from "../src/models/users/user.routes.js";
import { assetRoutes } from "../src/models/assets/asset.routes.js";
import { adminRoutes } from "../src/admin/admin.routes.js";
import { roleRoutes } from "../src/admin/role.routes.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { hashPassword } from "../src/utils/password.js";

const app = Fastify();
let token = "";
let companyId = "";
let departmentId = "";
let userId = "";
let assetId = "";
let licenseId = "";
let teamsId = "";
let settingId = "";

async function request(method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: object, status = 200) {
  const response = await app.inject({ method, url: `/api${url}`, payload, headers: token ? { authorization: `Bearer ${token}` } : {} });
  expect(response.statusCode, `${method} ${url}: ${response.body}`).toBe(status);
  return response.body ? response.json() : null;
}

beforeAll(async () => {
  state.db = new PGlite({ extensions: { citext } });
  for (const directory of ["migrations", "seeds"]) {
    for (const file of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
      let sql = await readFile(`${directory}/${file}`, "utf8");
      // PGlite has gen_random_uuid built in, but does not bundle pgcrypto.
      sql = sql.replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", "");
      await state.db.exec(sql);
    }
  }
  await state.db.query("INSERT INTO users (first_name,last_name,email,password_hash,is_super_admin) VALUES ($1,'Admin',$2,$3,TRUE)", ["Test Admin", "admin@example.test", await hashPassword("test-password-123")]);
  await app.register(jwt, { secret: "test-access-secret-with-at-least-32-characters" });
  app.setErrorHandler(errorHandler);
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  for (const routes of [organizationRoutes, assetRoutes, adminRoutes, roleRoutes]) await app.register(routes, { prefix: "/api" });
  await app.ready();
}, 30000);

afterAll(async () => { await app.close(); await state.db?.close(); });

it("logs in and authenticates every section with the issued token", async () => {
  const login = await request("POST", "/auth/login", { email: "admin@example.test", password: "test-password-123" });
  token = login.data.accessToken;
  const me = await request("GET", "/auth/me");
  expect(me.data.email).toBe("admin@example.test");
  for (const path of ["/dashboard/summary", "/companies", "/departments", "/locations", "/users", "/assets", "/assets/categories", "/assets/statuses", "/roles", "/autodesk", "/teams", "/settings"]) await request("GET", path);
});

it("adds and edits a company and department with blank optional email", async () => {
  companyId = (await request("POST", "/companies", { name: "Test Company", email: "" }, 201)).id;
  departmentId = (await request("POST", "/departments", { companyId, name: "IT", email: "" }, 201)).id;
  await request("PATCH", `/companies/${companyId}`, { name: "Updated Company", email: "" });
  await request("PATCH", `/departments/${departmentId}`, { name: "Technology", email: "" });
});

it("adds and edits users and locations", async () => {
  const location = await request("POST", "/locations", { companyId, name: "Office" }, 201);
  await request("PATCH", `/locations/${location.id}`, { name: "Main Office" });
  userId = (await request("POST", "/users", { companyId, departmentId, firstName: "Employee", email: "employee@example.test", password: "test-password-123", employeeId: "E-1" }, 201)).id;
  await request("PATCH", `/users/${userId}`, { jobTitle: "Engineer" });
});

it("adds, edits, assigns and returns an asset", async () => {
  const category = await request("POST", "/assets/categories", { name: "Test Category" }, 201);
  await request("PATCH", `/assets/categories/${category.id}`, { description: "Updated category" });
  const newStatus = await request("POST", "/assets/statuses", { name: "Test Status", isAssignable: true }, 201);
  await request("PATCH", `/assets/statuses/${newStatus.id}`, { description: "Updated status" });
  const categories = await request("GET", "/assets/categories");
  const statuses = await request("GET", "/assets/statuses");
  const status = statuses.find((item: { is_assignable: boolean }) => item.is_assignable);
  expect(statuses.find((item: { name: string }) => item.name === "In Repair").is_assignable).toBe(false);
  assetId = (await request("POST", "/assets", { companyId, departmentId, categoryId: categories[0].id, statusId: status.id, assetTag: "TEST-PC-1", serialNumber: "TEST-SN-1", hostname: "", model: "", purchaseDate: "2026-01-01" }, 201)).id;
  await request("PATCH", `/assets/${assetId}`, { model: "Workstation", purchaseDate: null });
  await request("POST", `/assets/${assetId}/assign`, { userId }, 201);
  expect((await request("GET", `/assets/${assetId}`)).status_name).toBe("Assigned");
  await request("DELETE", `/assets/${assetId}`, undefined, 409);
  await request("POST", `/assets/${assetId}/assign`, { userId }, 409);
  const other = await request("POST", "/users", { firstName: "Other", email: "other@example.test", password: "test-password-123" }, 201);
  const reassigned = await request("POST", `/assets/${assetId}/reassign`, { newUserId: other.id });
  expect(reassigned.user_id).toBe(other.id);
  await request("POST", `/assets/${assetId}/return`, { conditionOnReturn: "good" });
  expect((await request("GET", `/assets/${assetId}`)).status_name).toBe("Available");
  await request("POST", `/assets/${assetId}/assign`, { userId }, 201);
  await request("POST", `/assets/${assetId}/return`, { conditionOnReturn: "damaged" });
  expect((await request("GET", `/assets/${assetId}`)).status_name).toBe("Damaged");
  await request("POST", `/assets/${assetId}/assign`, { userId }, 400);
});

it("adds and edits Autodesk and Teams records", async () => {
  licenseId = (await request("POST", "/autodesk", { autodeskEmail: "", licenseType: "autocad", licenseStatus: "unassigned" }, 201)).id;
  await request("PATCH", `/autodesk/${licenseId}`, { userId, licenseStatus: "assigned", assignedDate: "2026-01-01" });
  teamsId = (await request("POST", "/teams", { userId, teamsEmail: "employee@example.test", assignedDate: "2026-01-01" }, 201)).id;
  await request("PATCH", `/teams/${teamsId}`, { notes: "Updated" });
  expect((await request("GET", "/autodesk")).rows[0].assigned_date).toBe("2026-01-01");
  expect((await request("GET", "/teams")).rows[0].assigned_date).toBe("2026-01-01");
});

it("stores string, array, boolean and null settings as JSON", async () => {
  settingId = (await request("POST", "/settings", { settingKey: "test.setting", settingValue: "Plain text" }, 201)).id;
  for (const settingValue of [["a", "b"], false, 0, null]) {
    const row = await request("PATCH", `/settings/${settingId}`, { settingValue });
    expect(row.setting_value).toEqual(settingValue);
    expect(row.updated_by).toBeTruthy();
  }
});

it("loads every report and exports a workbook", async () => {
  for (const type of ["assets", "users", "licenses"]) expect(await request("GET", `/reports/${type}`)).toBeInstanceOf(Array);
  const exportResponse = await app.inject({ url: "/api/reports/assets/export", headers: { authorization: `Bearer ${token}` } });
  expect(exportResponse.statusCode, exportResponse.body).toBe(200);
  expect(exportResponse.headers["content-type"]).toContain("spreadsheetml");
});

it("returns client errors for duplicate values, invalid references and invalid dates", async () => {
  await request("POST", "/teams", { userId, teamsEmail: "employee@example.test" }, 409);
  await request("POST", "/teams", { userId: "not-a-uuid", teamsEmail: "bad" }, 400);
  await request("PATCH", `/teams/${teamsId}`, { disabledDate: "2025-01-01" }, 400);
  await request("PATCH", `/autodesk/${licenseId}`, { expiryDate: "2025-01-01" }, 400);
  await request("GET", "/companies?page=abc", undefined, 400);
});

it("honors lockout and prevents restricted users changing administrator access", async () => {
  for (let attempt = 0; attempt < 5; attempt++) await request("POST", "/auth/login", { email: "employee@example.test", password: "wrong-password" }, 401);
  await request("POST", "/auth/login", { email: "employee@example.test", password: "test-password-123" }, 423);
  await state.db!.query("UPDATE users SET locked_until = NOW() - INTERVAL '1 minute' WHERE id = $1", [userId]);
  const login = await request("POST", "/auth/login", { email: "employee@example.test", password: "test-password-123" });
  const adminToken = token;
  token = login.data.accessToken;
  await request("GET", "/dashboard/summary", undefined, 403);
  await request("POST", "/companies", { name: "Forbidden" }, 403);
  await state.db!.query("INSERT INTO roles (name,code) VALUES ('Test User Editor','TEST_EDITOR')");
  await state.db!.query("INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r, permissions p WHERE r.code='TEST_EDITOR' AND p.code='USER_UPDATE'");
  await state.db!.query("INSERT INTO user_roles (user_id,role_id) SELECT $1,id FROM roles WHERE code='TEST_EDITOR'", [userId]);
  await request("PATCH", `/users/${userId}`, { isSuperAdmin: true }, 403);
  await request("PATCH", `/users/${userId}`, { roleIds: [] }, 403);
  await request("PATCH", `/users/${userId}`, { jobTitle: "Allowed edit" });
  token = adminToken;
});

it("deactivates test records", async () => {
  for (const [path, id] of [["autodesk", licenseId], ["teams", teamsId], ["settings", settingId], ["assets", assetId], ["users", userId], ["departments", departmentId], ["companies", companyId]]) await request("DELETE", `/${path}/${id}`);
});
