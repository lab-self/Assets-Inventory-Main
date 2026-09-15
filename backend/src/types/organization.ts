// ============================================================
// Organization Domain Types
// ============================================================

import type { UUID } from "./common.js";

export interface Company {
  id: UUID;

  name: string;
  legalName: string | null;
  description: string | null;

  email: string | null;
  phone: string | null;
  website: string | null;

  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: UUID;

  companyId: UUID;

  name: string;
  description: string | null;

  managerName: string | null;
  email: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: UUID;

  companyId: UUID;

  name: string;
  description: string | null;

  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;

  building: string | null;
  floor: string | null;
  room: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}