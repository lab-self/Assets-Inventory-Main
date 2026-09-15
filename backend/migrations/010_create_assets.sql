-- ============================================================
-- Inventory Management
-- Migration 010
-- Assets / Primary Hardware Inventory
-- ============================================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    asset_tag VARCHAR(100),

    hostname VARCHAR(255),

    category_id UUID NOT NULL,

    status_id UUID NOT NULL,

    company_id UUID,

    location_id UUID,

    serial_number VARCHAR(255),

    manufacturer VARCHAR(150),

    model VARCHAR(200),

    processor VARCHAR(255),

    ram_gb INTEGER,

    storage_gb INTEGER,

    storage_type VARCHAR(50),

    gpu VARCHAR(255),

    graphics_memory_gb INTEGER,

    antivirus VARCHAR(150),

    operating_system VARCHAR(150),

    mac_address VARCHAR(50),

    ip_address INET,

    purchase_date DATE,

    assigned_date DATE,

    warranty_start_date DATE,

    warranty_expiry_date DATE,

    vendor_name VARCHAR(250),

    purchase_order_number VARCHAR(150),

    invoice_number VARCHAR(150),

    purchase_cost NUMERIC(14, 2),

    currency VARCHAR(10) DEFAULT 'INR',

    asset_condition VARCHAR(50),

    remarks TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,

    updated_by UUID,

    CONSTRAINT fk_assets_category
        FOREIGN KEY (category_id)
        REFERENCES asset_categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_assets_status
        FOREIGN KEY (status_id)
        REFERENCES asset_statuses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_assets_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_assets_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_assets_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_assets_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_assets_asset_tag
        UNIQUE (asset_tag),

    CONSTRAINT uq_assets_serial_number
        UNIQUE (serial_number),

    CONSTRAINT uq_assets_hostname
        UNIQUE (hostname),

    CONSTRAINT chk_assets_ram_gb
        CHECK (
            ram_gb IS NULL
            OR ram_gb > 0
        ),

    CONSTRAINT chk_assets_storage_gb
        CHECK (
            storage_gb IS NULL
            OR storage_gb > 0
        ),

    CONSTRAINT chk_assets_graphics_memory_gb
        CHECK (
            graphics_memory_gb IS NULL
            OR graphics_memory_gb > 0
        ),

    CONSTRAINT chk_assets_purchase_cost
        CHECK (
            purchase_cost IS NULL
            OR purchase_cost >= 0
        ),

    CONSTRAINT chk_assets_dates
        CHECK (
            warranty_expiry_date IS NULL
            OR warranty_start_date IS NULL
            OR warranty_expiry_date >= warranty_start_date
        ),

    CONSTRAINT chk_assets_assigned_date
        CHECK (
            assigned_date IS NULL
            OR purchase_date IS NULL
            OR assigned_date >= purchase_date
        ),

    CONSTRAINT chk_assets_mac_address
        CHECK (
            mac_address IS NULL
            OR mac_address ~* '^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$'
        ),

    CONSTRAINT chk_assets_condition
        CHECK (
            asset_condition IS NULL
            OR asset_condition IN (
                'new',
                'good',
                'fair',
                'poor',
                'damaged'
            )
        )
);


CREATE INDEX idx_assets_category
    ON assets(category_id);

CREATE INDEX idx_assets_status
    ON assets(status_id);

CREATE INDEX idx_assets_company
    ON assets(company_id);

CREATE INDEX idx_assets_location
    ON assets(location_id);

CREATE INDEX idx_assets_serial_number
    ON assets(serial_number);

CREATE INDEX idx_assets_hostname
    ON assets(hostname);

CREATE INDEX idx_assets_purchase_date
    ON assets(purchase_date);

CREATE INDEX idx_assets_warranty_expiry
    ON assets(warranty_expiry_date);

CREATE INDEX idx_assets_vendor
    ON assets(vendor_name);

CREATE INDEX idx_assets_active
    ON assets(is_active);

CREATE INDEX idx_assets_created_at
    ON assets(created_at);