-- Existing services read and write this field, but the original schema omitted it.
ALTER TABLE asset_statuses ADD COLUMN IF NOT EXISTS is_assignable BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE asset_statuses SET is_assignable = FALSE
WHERE code IN ('IN_REPAIR', 'MAINTENANCE', 'LOST', 'STOLEN', 'DAMAGED', 'RETIRED', 'DISPOSED');
