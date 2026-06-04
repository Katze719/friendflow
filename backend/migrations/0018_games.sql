-- Games tool: tournaments scoped to a group. The wheel ("Glücksrad") is a
-- purely client-side feature and needs no tables; only tournaments are
-- persisted here.
--
-- A tournament runs through three statuses: `setup` (add participants, build
-- teams, assign), `active` (matches generated, results being entered) and
-- `completed` (all matches played). The competing unit is normalised into
-- `tournament_entrants` at start time so `tournament_matches` always has a
-- single FK source regardless of whether teams are enabled.

CREATE TABLE tournaments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    format      TEXT NOT NULL DEFAULT 'points'
                CHECK (format IN ('points', 'elimination')),
    -- When true, people are grouped into teams and teams compete.
    team_mode   BOOLEAN NOT NULL DEFAULT FALSE,
    -- People per team: the target the randomizer aims for. Not a hard limit;
    -- teams can be resized manually afterwards.
    team_size   INT,
    status      TEXT NOT NULL DEFAULT 'setup'
                CHECK (status IN ('setup', 'active', 'completed')),
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (char_length(trim(name)) > 0),
    CHECK (team_size IS NULL OR team_size >= 1)
);
CREATE INDEX idx_tournaments_group ON tournaments(group_id, created_at DESC);

-- Teams only exist while `team_mode` is on. Created either by the randomizer
-- or manually.
CREATE TABLE tournament_teams (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    position      INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tournament_teams_tournament
    ON tournament_teams(tournament_id, position);

-- The people in a tournament. A participant is either a real group member
-- (`user_id` set) or a name-only guest (`user_id` NULL). `display_name` is
-- always stored so guests and members render the same way and the name stays
-- stable even if a member later leaves the group.
CREATE TABLE tournament_participants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    display_name  TEXT NOT NULL,
    team_id       UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
    position      INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (char_length(trim(display_name)) > 0)
);
CREATE INDEX idx_tournament_participants_tournament
    ON tournament_participants(tournament_id, position);
CREATE INDEX idx_tournament_participants_team
    ON tournament_participants(team_id);

-- The competing unit, materialised when the tournament starts. One row per
-- team in team mode, otherwise one row per participant.
CREATE TABLE tournament_entrants (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    kind           TEXT NOT NULL CHECK (kind IN ('participant', 'team')),
    participant_id UUID REFERENCES tournament_participants(id) ON DELETE CASCADE,
    team_id        UUID REFERENCES tournament_teams(id) ON DELETE CASCADE,
    display_name   TEXT NOT NULL,
    seed           INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_tournament_entrants_tournament
    ON tournament_entrants(tournament_id, seed);

-- One match between two entrants. For points (round-robin) every pairing is a
-- match. For elimination, all rounds are created up front and linked via
-- `next_match_id` / `next_slot` so the winner can advance automatically; a
-- NULL entrant slot represents a bye or a not-yet-decided feeder match.
CREATE TABLE tournament_matches (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id     UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round             INT NOT NULL DEFAULT 1,
    match_index       INT NOT NULL DEFAULT 0,
    entrant_a_id      UUID REFERENCES tournament_entrants(id) ON DELETE SET NULL,
    entrant_b_id      UUID REFERENCES tournament_entrants(id) ON DELETE SET NULL,
    score_a           INT,
    score_b           INT,
    winner_entrant_id UUID REFERENCES tournament_entrants(id) ON DELETE SET NULL,
    status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'done')),
    next_match_id     UUID REFERENCES tournament_matches(id) ON DELETE SET NULL,
    next_slot         CHAR(1) CHECK (next_slot IN ('a', 'b'))
);
CREATE INDEX idx_tournament_matches_tournament
    ON tournament_matches(tournament_id, round, match_index);
