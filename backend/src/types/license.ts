// ============================================================
// License & Account Types
// ============================================================

import type {
  LicenseStatus,
  TeamsAccountStatus,
  UUID
} from "./common.js";

export type AutodeskLicenseType =
  | "aec"
  | "forma"
  | "autocad"
  | "revit"
  | "maya"
  | "3ds_max"
  | "civil_3d"
  | "fusion"
  | "collaboration"
  | "other";

export interface AutodeskLicense {
  id: UUID;

  userId: UUID | null;

  autodeskEmail: string | null;

  licenseType: AutodeskLicenseType;

  licenseStatus: LicenseStatus;

  licenseIdentifier: string | null;

  assignedDate: string | null;
  expiryDate: string | null;

  vendorName: string;

  credentialSecretRef: string | null;

  notes: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface TeamsAccount {
  id: UUID;

  userId: UUID;

  teamsEmail: string;

  accountStatus: TeamsAccountStatus;

  assignedDate: string | null;
  disabledDate: string | null;

  notes: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}