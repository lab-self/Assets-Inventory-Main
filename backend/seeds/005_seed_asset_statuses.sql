-- ============================================================
-- 005_seed_asset_statuses.sql
-- Default Asset Statuses
-- ============================================================

INSERT INTO asset_statuses (
    name,
    code,
    description,
    is_system_status,
    is_active
)
VALUES
(
    'Available',
    'AVAILABLE',
    'Asset is available and not currently assigned.',
    TRUE,
    TRUE
),
(
    'Assigned',
    'ASSIGNED',
    'Asset is currently assigned to an employee.',
    TRUE,
    TRUE
),
(
    'In Repair',
    'IN_REPAIR',
    'Asset is currently under repair or maintenance.',
    TRUE,
    TRUE
),
(
    'Under Maintenance',
    'MAINTENANCE',
    'Asset is undergoing scheduled maintenance.',
    TRUE,
    TRUE
),
(
    'Lost',
    'LOST',
    'Asset has been reported lost.',
    TRUE,
    TRUE
),
(
    'Stolen',
    'STOLEN',
    'Asset has been reported stolen.',
    TRUE,
    TRUE
),
(
    'Damaged',
    'DAMAGED',
    'Asset is damaged and unavailable for normal use.',
    TRUE,
    TRUE
),
(
    'Retired',
    'RETIRED',
    'Asset has been retired from active inventory.',
    TRUE,
    TRUE
),
(
    'Disposed',
    'DISPOSED',
    'Asset has been disposed of.',
    TRUE,
    TRUE
)
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system_status = EXCLUDED.is_system_status,
    is_active = EXCLUDED.is_active;