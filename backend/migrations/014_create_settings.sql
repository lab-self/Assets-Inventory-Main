-- ============================================================
-- 014_create_settings.sql
-- Application Settings
-- ============================================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    setting_key VARCHAR(150) NOT NULL,

    category VARCHAR(50) NOT NULL DEFAULT 'general',

    setting_value JSONB NOT NULL,

    description TEXT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    updated_by UUID NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_settings_setting_key
        UNIQUE (setting_key),

    CONSTRAINT fk_settings_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_settings_category
        CHECK (
            category IN (
                'general',
                'security',
                'notification',
                'email',
                'asset',
                'license',
                'system',
                'appearance',
                'maintenance',
                'other'
            )
        )
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_settings_category
    ON settings(category);

CREATE INDEX idx_settings_active
    ON settings(is_active);

CREATE INDEX idx_settings_updated_by
    ON settings(updated_by);

CREATE INDEX idx_settings_updated_at
    ON settings(updated_at);

CREATE INDEX idx_settings_value_gin
    ON settings
    USING GIN(setting_value);