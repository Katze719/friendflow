-- Personal calendars + categories.
--
-- Events grow a second ownership axis: either a group (shared with all
-- members, current behavior) or a single user (personal calendar, only
-- visible to its owner). Categories are scoped the same way. A single
-- CHECK enforces exactly-one owner per row; existing rows stay
-- group-owned without change.

CREATE TABLE calendar_categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id      UUID REFERENCES groups(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    color         TEXT NOT NULL DEFAULT '#64748b',
    created_by    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT calendar_categories_owner_xor
        CHECK ((group_id IS NOT NULL) <> (owner_user_id IS NOT NULL))
);

-- Category names are unique within their calendar scope so the UI can
-- rely on name-based lookups if needed.
CREATE UNIQUE INDEX idx_calendar_categories_group_name
    ON calendar_categories(group_id, name) WHERE group_id IS NOT NULL;
CREATE UNIQUE INDEX idx_calendar_categories_user_name
    ON calendar_categories(owner_user_id, name) WHERE owner_user_id IS NOT NULL;

ALTER TABLE calendar_events
    ALTER COLUMN group_id DROP NOT NULL,
    ADD COLUMN owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN category_id UUID REFERENCES calendar_categories(id) ON DELETE SET NULL,
    ADD CONSTRAINT calendar_events_owner_xor
        CHECK ((group_id IS NOT NULL) <> (owner_user_id IS NOT NULL));

CREATE INDEX idx_calendar_events_owner_start
    ON calendar_events(owner_user_id, starts_at)
    WHERE owner_user_id IS NOT NULL;
