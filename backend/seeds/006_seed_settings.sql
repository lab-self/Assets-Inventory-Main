-- ============================================================
-- 006_seed_settings.sql
-- Default Application Settings
-- ============================================================

INSERT INTO settings (
    setting_key,
    category,
    setting_value,
    description,
    is_active
)
VALUES

(
    'app.name',
    'general',
    '"Inventory Management"',
    'Application display name.',
    TRUE
),

(
    'app.default_page_size',
    'general',
    '25',
    'Default number of records displayed per page.',
    TRUE
),

(
    'app.max_page_size',
    'general',
    '100',
    'Maximum number of records allowed per page.',
    TRUE
),

(
    'asset.warranty_warning_days',
    'asset',
    '30',
    'Number of days before warranty expiry when a warning notification should be generated.',
    TRUE
),

(
    'license.expiry_warning_days',
    'license',
    '30',
    'Number of days before license expiry when a warning notification should be generated.',
    TRUE
),

(
    'notification.enabled',
    'notification',
    'true',
    'Enable application notifications.',
    TRUE
),

(
    'notification.retention_days',
    'notification',
    '90',
    'Number of days notification records should be retained.',
    TRUE
),

(
    'audit.retention_days',
    'system',
    '365',
    'Number of days audit records should normally be retained.',
    TRUE
),

(
    'import.max_file_size_mb',
    'asset',
    '20',
    'Maximum allowed inventory import file size in megabytes.',
    TRUE
),

(
    'security.max_login_attempts',
    'security',
    '5',
    'Maximum failed login attempts before temporary account lockout.',
    TRUE
),

(
    'security.lockout_minutes',
    'security',
    '15',
    'Account lockout duration in minutes.',
    TRUE
),

(
    'security.session_timeout_minutes',
    'security',
    '15',
    'Application access-token/session timeout policy in minutes.',
    TRUE
)

ON CONFLICT (setting_key)
DO UPDATE SET
    category = EXCLUDED.category,
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;