// ============================================================
// Asset Domain Types
// ============================================================

import type {
  AssetCondition,
  AssetStorageType,
  UUID
} from "./common.js";

export interface Asset {
  id: UUID;
  assetTag: string;
  hostname: string | null;

  categoryId: UUID;
  statusId: UUID;

  companyId: UUID;
  locationId: UUID | null;

  serialNumber: string | null;

  manufacturer: string | null;
  model: string | null;

  processor: string | null;

  ramGb: number | null;

  storageGb: number | null;
  storageType: AssetStorageType | null;

  gpu: string | null;
  graphicsMemoryGb: number | null;

  antivirus: string | null;
  operatingSystem: string | null;

  macAddress: string | null;
  ipAddress: string | null;

  purchaseDate: string | null;
  assignedDate: string | null;

  warrantyStartDate: string | null;
  warrantyExpiryDate: string | null;

  vendorName: string | null;
  purchaseOrderNumber: string | null;
  invoiceNumber: string | null;

  purchaseCost: number | null;
  currency: string;

  assetCondition: AssetCondition;
  remarks: string | null;

  isActive: boolean;

  createdBy: UUID | null;
  updatedBy: UUID | null;

  createdAt: string;
  updatedAt: string;
}

export interface AssetAssignment {
  id: UUID;
  assetId: UUID;
  userId: UUID;

  assignedAt: string;
  returnedAt: string | null;

  assignmentStatus: "assigned" | "returned" | "cancelled";

  assignedBy: UUID | null;
  returnedBy: UUID | null;

  assignmentNotes: string | null;

  createdAt: string;
  updatedAt: string;
}