-- ============================================================
-- 012_create_autodesk_licenses.sql
-- Autodesk License Management
-- ============================================================

CREATE TABLE autodesk_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Linked employee/user.
    -- Nullable because a license may exist before assignment.
    user_id UUID NULL,

    -- Autodesk account identity may differ from employee email.
    autodesk_email CITEXT NULL,

    license_type VARCHAR(50) NOT NULL DEFAULT 'other',

    license_status VARCHAR(30) NOT NULL DEFAULT 'unassigned',

    license_identifier VARCHAR(255) NULL,

    assigned_date DATE NULL,

    expiry_date DATE NULL,

    vendor_name VARCHAR(255) NOT NULL DEFAULT 'Autodesk',

    -- Reference to a secret-management system.
    -- Never store Autodesk passwords or credentials in plaintext.
    credential_secret_ref VARCHAR(500) NULL,

    notes TEXT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_autodesk_license_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_autodesk_license_identifier
        UNIQUE (license_identifier),

    CONSTRAINT chk_autodesk_license_type
        CHECK (
            license_type IN (
                'aec',
                'forma',
                'autocad',
                'revit',
                'maya',
                '3ds_max',
                'civil_3d',
                'fusion',
                'collaboration',
                'other'
            )
        ),

    CONSTRAINT chk_autodesk_license_status
        CHECK (
            license_status IN (
                'assigned',
                'unassigned',
                'expired',
                'suspended',
                'pending',
                'cancelled',
                'other'
            )
        ),

    CONSTRAINT chk_autodesk_license_dates
        CHECK (
            expiry_date IS NULL
            OR assigned_date IS NULL
            OR expiry_date >= assigned_date
        )
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_autodesk_licenses_user_id
    ON autodesk_licenses(user_id);

CREATE INDEX idx_autodesk_licenses_status
    ON autodesk_licenses(license_status);

CREATE INDEX idx_autodesk_licenses_type
    ON autodesk_licenses(license_type);

CREATE INDEX idx_autodesk_licenses_expiry_date
    ON autodesk_licenses(expiry_date);

CREATE INDEX idx_autodesk_licenses_active
    ON autodesk_licenses(is_active);

CREATE INDEX idx_autodesk_licenses_email
    ON autodesk_licenses(autodesk_email);

CREATE INDEX idx_autodesk_licenses_created_at
    ON autodesk_licenses(created_at);