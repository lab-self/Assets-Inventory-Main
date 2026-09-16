-- ============================================================
-- Inventory Management
-- Migration 019
-- Align legacy asset column names with the application model.
-- Renames preserve existing data and indexes/constraints where possible.
-- ============================================================

ALTER TABLE assets RENAME COLUMN processor TO cpu;
ALTER TABLE assets RENAME COLUMN storage_gb TO storage_capacity_gb;
ALTER TABLE assets RENAME COLUMN warranty_expiry_date TO warranty_end_date;
ALTER TABLE assets RENAME COLUMN vendor_name TO vendor;
ALTER TABLE assets RENAME COLUMN asset_condition TO condition;
ALTER TABLE assets RENAME COLUMN remarks TO notes;

-- The application model treats these fields as the canonical names.
-- Existing data is preserved by the column renames above.

ALTER TABLE asset_assignments RENAME COLUMN assignment_status TO status;

-- Keep the active-assignment constraint aligned with the canonical column.
DROP INDEX IF EXISTS uq_asset_assignments_active_asset;
CREATE UNIQUE INDEX uq_asset_assignments_active_asset
    ON asset_assignments(asset_id)
    WHERE status = 'assigned'
      AND returned_at IS NULL;
