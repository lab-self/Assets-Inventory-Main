-- ============================================================
-- 013_create_teams_accounts.sql
-- Microsoft Teams Account Management
-- ============================================================

CREATE TABLE teams_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    teams_email CITEXT NOT NULL,

    account_status VARCHAR(30) NOT NULL DEFAULT 'active',

    assigned_date DATE NULL,

    disabled_date DATE NULL,

    notes TEXT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_teams_account_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_teams_account_email
        UNIQUE (teams_email),

    CONSTRAINT chk_teams_account_status
        CHECK (
            account_status IN (
                'active',
                'inactive',
                'disabled',
                'pending',
                'blocked',
                'other'
            )
        ),

    CONSTRAINT chk_teams_account_dates
        CHECK (
            disabled_date IS NULL
            OR assigned_date IS NULL
            OR disabled_date >= assigned_date
        )
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_teams_accounts_user_id
    ON teams_accounts(user_id);

CREATE INDEX idx_teams_accounts_status
    ON teams_accounts(account_status);

CREATE INDEX idx_teams_accounts_active
    ON teams_accounts(is_active);

CREATE INDEX idx_teams_accounts_assigned_date
    ON teams_accounts(assigned_date);

CREATE INDEX idx_teams_accounts_created_at
    ON teams_accounts(created_at);