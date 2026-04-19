-- Multiple shopping lists per group.
--
-- Previously every group had exactly one implicit shopping checklist; the
-- UI is moving to a dropdown that lets users juggle several lists (e.g.
-- "weekly groceries" vs. "camping trip"). We introduce `shopping_lists`
-- as the new owner of items, backfill a default list per existing group,
-- and migrate every existing item onto it. `shopping_items.group_id`
-- stays so membership checks stay cheap without a second JOIN.

CREATE TABLE shopping_lists (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shopping_lists_group ON shopping_lists(group_id);

-- One default list per existing group, using the group's creator so the
-- created_by FK is always valid even for legacy rows.
INSERT INTO shopping_lists (group_id, name, created_by)
SELECT g.id, 'Einkaufsliste', g.created_by
FROM groups g;

ALTER TABLE shopping_items ADD COLUMN list_id UUID;

-- Every existing item belongs to the group's default list. There is
-- exactly one default list per group at this point, so the subselect is
-- deterministic.
UPDATE shopping_items si
SET list_id = (
    SELECT sl.id FROM shopping_lists sl WHERE sl.group_id = si.group_id LIMIT 1
);

ALTER TABLE shopping_items
    ALTER COLUMN list_id SET NOT NULL,
    ADD CONSTRAINT fk_shopping_items_list
        FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE;

CREATE INDEX idx_shopping_items_list_state
    ON shopping_items(list_id, is_done, created_at DESC);
DROP INDEX IF EXISTS idx_shopping_items_group_state;
