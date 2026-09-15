// ============================================================
// Notification Types
// ============================================================

import type { NotificationType, UUID } from "./common.js";

export interface Notification {
  id: UUID;

  userId: UUID;

  notificationType: NotificationType;

  title: string;
  message: string;

  entityType: string | null;
  entityId: UUID | null;

  isRead: boolean;
  readAt: string | null;

  expiresAt: string | null;

  createdAt: string;
}