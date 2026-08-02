-- Group-scoped people decouple a person's financial identity from their
-- ability to sign in. Account-backed people deliberately keep the user's UUID
-- as their person UUID, preserving the existing Ledger API for old clients.
CREATE TABLE group_people (
    group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    id           UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
    display_name TEXT NOT NULL,
    kind         TEXT NOT NULL CHECK (kind IN ('member', 'guest')),
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, id),
    UNIQUE (group_id, user_id),
    CHECK (char_length(trim(display_name)) BETWEEN 1 AND 80),
    CHECK ((kind = 'member' AND user_id IS NOT NULL) OR kind = 'guest')
);
CREATE INDEX idx_group_people_user ON group_people(user_id);
CREATE INDEX idx_group_people_active ON group_people(group_id, active, display_name);

INSERT INTO group_people (group_id, id, user_id, display_name, kind, active, created_by, created_at, updated_at)
SELECT gm.group_id, gm.user_id, gm.user_id, u.display_name, 'member', TRUE,
       g.created_by, gm.joined_at, NOW()
FROM group_members gm
INNER JOIN users u ON u.id = gm.user_id
INNER JOIN groups g ON g.id = gm.group_id;

-- People can leave a group while their expenses, splits and payments remain as
-- historical ledger data. Preserve those account-backed identities as inactive
-- group people before replacing the old user-only foreign keys below.
WITH ledger_people AS (
    SELECT group_id, paid_by AS user_id
    FROM expenses
    UNION
    SELECT e.group_id, es.user_id
    FROM expense_splits es
    INNER JOIN expenses e ON e.id = es.expense_id
    UNION
    SELECT group_id, from_user AS user_id
    FROM splitwise_payments
    UNION
    SELECT group_id, to_user AS user_id
    FROM splitwise_payments
)
INSERT INTO group_people (group_id, id, user_id, display_name, kind, active, created_by)
SELECT lp.group_id, lp.user_id, lp.user_id, u.display_name, 'member', FALSE, g.created_by
FROM ledger_people lp
INNER JOIN users u ON u.id = lp.user_id
INNER JOIN groups g ON g.id = lp.group_id
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Ledger UUID columns now reference a person in the same group. Their names
-- stay unchanged for wire compatibility; for account-backed people the values
-- are also unchanged because person id == user id.
ALTER TABLE expenses DROP CONSTRAINT expenses_paid_by_fkey;
ALTER TABLE expenses
    ADD CONSTRAINT expenses_paid_by_person_fkey
    FOREIGN KEY (group_id, paid_by) REFERENCES group_people(group_id, id) ON DELETE RESTRICT;

ALTER TABLE expense_splits ADD COLUMN group_id UUID;
UPDATE expense_splits es
SET group_id = e.group_id
FROM expenses e
WHERE e.id = es.expense_id;
ALTER TABLE expense_splits ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE expense_splits DROP CONSTRAINT expense_splits_user_id_fkey;
ALTER TABLE expense_splits
    ADD CONSTRAINT expense_splits_group_fkey
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE expense_splits
    ADD CONSTRAINT expense_splits_person_fkey
    FOREIGN KEY (group_id, user_id) REFERENCES group_people(group_id, id) ON DELETE RESTRICT;

ALTER TABLE splitwise_payments DROP CONSTRAINT splitwise_payments_from_user_fkey;
ALTER TABLE splitwise_payments DROP CONSTRAINT splitwise_payments_to_user_fkey;
-- Linking a guest to an account can turn an old transfer between those two
-- identities into a harmless self-transfer. Creation still rejects these in
-- the application; retaining the historical row avoids silent data loss.
ALTER TABLE splitwise_payments DROP CONSTRAINT splitwise_payments_check;
ALTER TABLE splitwise_payments
    ADD CONSTRAINT splitwise_payments_from_person_fkey
    FOREIGN KEY (group_id, from_user) REFERENCES group_people(group_id, id) ON DELETE RESTRICT;
ALTER TABLE splitwise_payments
    ADD CONSTRAINT splitwise_payments_to_person_fkey
    FOREIGN KEY (group_id, to_user) REFERENCES group_people(group_id, id) ON DELETE RESTRICT;
