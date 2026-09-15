-- ============================================================
-- 016_create_audit_logs.sql
-- Enterprise Audit Trail
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID NULL,

    ip_address INET NULL,

    user_agent TEXT NULL,

    previous_values JSONB NULL,

    new_values JSONB NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_audit_logs_user_id
    ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_action
    ON audit_logs(action);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_logs_created_at
    ON audit_logs(created_at DESC);

CREATE INDEX idx_audit_logs_ip_address
    ON audit_logs(ip_address);

CREATE INDEX idx_audit_logs_previous_values
    ON audit_logs
    USING GIN(previous_values);

CREATE INDEX idx_audit_logs_new_values
    ON audit_logs
    USING GIN(new_values);