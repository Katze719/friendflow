-- Link splitwise expenses to a specific trip so the per-trip budget widget
-- can sum only the expenses assigned to that trip.
--
-- trip_id is nullable: existing expenses stay unassigned ("allgemeine
-- Gruppen-Ausgabe") and don't contribute to any trip budget. Deleting the
-- trip keeps the expense around with trip_id = NULL so nobody loses their
-- history by accident.
ALTER TABLE expenses
    ADD COLUMN trip_id UUID NULL
    REFERENCES trips(id) ON DELETE SET NULL;

CREATE INDEX idx_expenses_trip ON expenses(trip_id);
