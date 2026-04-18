-- Trip board folders: organize links by topic (e.g. "Flights", "Airbnbs",
-- "Restaurants"). Links without a folder fall into an implicit "unsorted"
-- bucket client-side.
CREATE TABLE trip_folders (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_trip_folders_group ON trip_folders(group_id);

-- SET NULL on delete keeps the link but moves it back to "unsorted".
ALTER TABLE trip_links
    ADD COLUMN folder_id UUID REFERENCES trip_folders(id) ON DELETE SET NULL;
CREATE INDEX idx_trip_links_folder ON trip_links(folder_id);
