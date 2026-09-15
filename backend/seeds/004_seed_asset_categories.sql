-- ============================================================
-- 004_seed_asset_categories.sql
-- Default Asset Categories
-- ============================================================

INSERT INTO asset_categories (
    name,
    code,
    description,
    is_system_category,
    is_active
)
VALUES
(
    'Laptop',
    'LAPTOP',
    'Portable laptop computers.',
    TRUE,
    TRUE
),
(
    'Desktop',
    'DESKTOP',
    'Desktop computers and workstations.',
    TRUE,
    TRUE
),
(
    'Monitor',
    'MONITOR',
    'Computer monitors and displays.',
    TRUE,
    TRUE
),
(
    'Server',
    'SERVER',
    'Physical servers.',
    TRUE,
    TRUE
),
(
    'Printer',
    'PRINTER',
    'Printers and multifunction devices.',
    TRUE,
    TRUE
),
(
    'Network Equipment',
    'NETWORK',
    'Switches, routers, access points and related network equipment.',
    TRUE,
    TRUE
),
(
    'Mobile Device',
    'MOBILE',
    'Mobile phones and tablets.',
    TRUE,
    TRUE
),
(
    'Peripheral',
    'PERIPHERAL',
    'Keyboards, mice, docking stations and other peripherals.',
    TRUE,
    TRUE
),
(
    'UPS',
    'UPS',
    'Uninterruptible power supply equipment.',
    TRUE,
    TRUE
),
(
    'Storage Device',
    'STORAGE',
    'External storage and backup devices.',
    TRUE,
    TRUE
),
(
    'Software License',
    'SOFTWARE',
    'Software licenses and subscriptions.',
    TRUE,
    TRUE
),
(
    'Other',
    'OTHER',
    'Other inventory items.',
    TRUE,
    TRUE
)
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system_category = EXCLUDED.is_system_category,
    is_active = EXCLUDED.is_active;