-- ============================================================
-- 015_create_notifications.sql
-- Application Notifications
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    notification_type VARCHAR(30) NOT NULL DEFAULT 'info',

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    entity_type VARCHAR(100) NULL,

    entity_id UUID NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMPTZ NULL,

    expires_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_notification_type
        CHECK (
            notification_type IN (
                'info',
                'success',
                'warning',
                'error'
            )
        ),

    CONSTRAINT chk_notification_read_state
        CHECK (
            (is_read = FALSE AND read_at IS NULL)
            OR
            (is_read = TRUE AND read_at IS NOT NULL)
        )
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_notifications_user_id
    ON notifications(user_id);

CREATE INDEX idx_notifications_unread
    ON notifications(user_id, is_read, created_at DESC)
    WHERE is_read = FALSE;

CREATE INDEX idx_notifications_created_at
    ON notifications(created_at DESC);

CREATE INDEX idx_notifications_entity
    ON notifications(entity_type, entity_id);

CREATE INDEX idx_notifications_expires_at
    ON notifications(expires_at);