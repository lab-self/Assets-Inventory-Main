// ============================================================
// Audit Log Types
// ============================================================

import type { UUID } from "./common.js";

export interface AuditLog {
  id: UUID;

  userId: UUID | null;

  action: string;

  entityType: string;

  entityId: UUID | null;

  ipAddress: string | null;

  userAgent: string | null;

  previousValues: Record<string, unknown> | null;

  newValues: Record<string, unknown> | null;

  createdAt: string;
}