import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { AppError } from "../utils/errors.js";

/**
 * The route layer uses readable module.action names while the
 * database stores stable permission codes. Keep the mapping in
 * one place so RBAC remains consistent across all modules.
 */
const PERMISSION_ALIASES: Record<string, string> = {
  "dashboard.read": "DASHBOARD_VIEW",

  "assets.read": "ASSET_VIEW",
  "assets.create": "ASSET_CREATE",
  "assets.update": "ASSET_UPDATE",
  "assets.delete": "ASSET_DELETE",
  "assets.assign": "ASSET_ASSIGN",
  "assets.return": "ASSET_RETURN",
  "assets.import": "ASSET_IMPORT",
  "assets.export": "ASSET_EXPORT",

  "users.read": "USER_VIEW",
  "users.create": "USER_CREATE",
  "users.update": "USER_UPDATE",
  "users.delete": "USER_DELETE",
  "users.manage_roles": "USER_ROLE_MANAGE",

  "companies.read": "COMPANY_VIEW",
  "companies.create": "COMPANY_CREATE",
  "companies.update": "COMPANY_UPDATE",
  "companies.delete": "COMPANY_DELETE",

  "departments.read": "DEPARTMENT_VIEW",
  "departments.create": "DEPARTMENT_CREATE",
  "departments.update": "DEPARTMENT_UPDATE",
  "departments.delete": "DEPARTMENT_DELETE",

  "locations.read": "LOCATION_VIEW",
  "locations.create": "LOCATION_CREATE",
  "locations.update": "LOCATION_UPDATE",
  "locations.delete": "LOCATION_DELETE",

  "asset_categories.read": "CATEGORY_MANAGE",
  "asset_categories.create": "CATEGORY_MANAGE",
  "asset_categories.update": "CATEGORY_MANAGE",
  "asset_categories.delete": "CATEGORY_MANAGE",

  "asset_statuses.read": "STATUS_MANAGE",
  "asset_statuses.create": "STATUS_MANAGE",
  "asset_statuses.update": "STATUS_MANAGE",
  "asset_statuses.delete": "STATUS_MANAGE",

  "autodesk.read": "AUTODESK_VIEW",
  "autodesk.create": "AUTODESK_MANAGE",
  "autodesk.update": "AUTODESK_MANAGE",
  "autodesk.delete": "AUTODESK_MANAGE",
  "autodesk.manage": "AUTODESK_MANAGE",

  "teams.read": "TEAMS_VIEW",
  "teams.create": "TEAMS_MANAGE",
  "teams.update": "TEAMS_MANAGE",
  "teams.delete": "TEAMS_MANAGE",
  "teams.manage": "TEAMS_MANAGE",

  "reports.read": "REPORT_VIEW",
  "reports.export": "REPORT_EXPORT",

  "audit.read": "AUDIT_VIEW",

  "settings.read": "SETTING_VIEW",
  "settings.create": "SETTING_MANAGE",
  "settings.update": "SETTING_MANAGE",
  "settings.delete": "SETTING_MANAGE",
  "settings.manage": "SETTING_MANAGE",
};

function normalizePermission(permission: string): string {
  return PERMISSION_ALIASES[permission] ?? permission;
}

export function requirePermission(permission: string) {
  return async (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    const user = request.authenticatedUser;

    if (!user) {
      throw new AppError(
        "Authentication required.",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    if (user.isSuperAdmin) {
      return;
    }

    const requiredPermission = normalizePermission(permission);

    if (!user.permissions.includes(requiredPermission)) {
      throw new AppError(
        "You do not have permission to perform this action.",
        403,
        "FORBIDDEN",
      );
    }
  };
}

export function requireRole(role: string) {
  return async (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    const user = request.authenticatedUser;

    if (!user) {
      throw new AppError(
        "Authentication required.",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    if (user.isSuperAdmin) {
      return;
    }

    if (!user.roles.includes(role)) {
      throw new AppError(
        "You do not have the required role.",
        403,
        "FORBIDDEN",
      );
    }
  };
}
