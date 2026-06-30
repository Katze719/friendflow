-- Account deletion support.
--
-- Shared group records keep stable user foreign keys for historical integrity,
-- so deleting an account anonymizes the user row instead of physically
-- removing it. `deleted_at` lets auth/admin code reject and hide those rows.

ALTER TABLE users
    ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_users_deleted_at ON users(deleted_at);
