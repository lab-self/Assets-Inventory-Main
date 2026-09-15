// ============================================================
// Common Application Types
// ============================================================

export type UUID = string;

export type ISODateString = string;

export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "locked";

export type AssetCondition =
  | "new"
  | "good"
  | "fair"
  | "damaged"
  | "retired";

export type AssetStorageType =
  | "HDD"
  | "SSD"
  | "NVMe"
  | "Hybrid"
  | "Other";

export type AssignmentStatus =
  | "assigned"
  | "returned"
  | "cancelled";

export type LicenseStatus =
  | "assigned"
  | "unassigned"
  | "expired"
  | "suspended"
  | "pending"
  | "cancelled"
  | "other";

export type TeamsAccountStatus =
  | "active"
  | "inactive"
  | "disabled"
  | "pending"
  | "blocked"
  | "other";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error";

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}