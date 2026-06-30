use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    auth::middleware::AuthUser,
    error::{AppError, AppResult},
    groups::ensure_member,
    state::AppState,
};

// ---------- response types ----------

#[derive(Debug, Serialize)]
pub struct TournamentSummary {
    pub id: Uuid,
    pub name: String,
    pub format: String,
    pub team_mode: bool,
    pub team_size: Option<i32>,
    pub status: String,
    pub participant_count: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ParticipantOut {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub display_name: String,
    pub team_id: Option<Uuid>,
    pub position: i32,
}

#[derive(Debug, Serialize)]
pub struct TeamOut {
    pub id: Uuid,
    pub name: String,
    pub position: i32,
    pub member_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct EntrantOut {
    pub id: Uuid,
    pub kind: String,
    pub participant_id: Option<Uuid>,
    pub team_id: Option<Uuid>,
    pub display_name: String,
    pub seed: i32,
}

#[derive(Debug, Serialize)]
pub struct MatchOut {
    pub id: Uuid,
    pub round: i32,
    pub match_index: i32,
    pub entrant_a_id: Option<Uuid>,
    pub entrant_b_id: Option<Uuid>,
    pub score_a: Option<i32>,
    pub score_b: Option<i32>,
    pub winner_entrant_id: Option<Uuid>,
    pub status: String,
    pub next_match_id: Option<Uuid>,
    pub next_slot: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct StandingRow {
    pub entrant_id: Uuid,
    pub display_name: String,
    pub played: i32,
    pub wins: i32,
    pub draws: i32,
    pub losses: i32,
    pub points: i32,
}

#[derive(Debug, Serialize)]
pub struct TournamentDetail {
    pub id: Uuid,
    pub group_id: Uuid,
    pub name: String,
    pub format: String,
    pub team_mode: bool,
    pub team_size: Option<i32>,
    pub status: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub participants: Vec<ParticipantOut>,
    pub teams: Vec<TeamOut>,
    pub entrants: Vec<EntrantOut>,
    pub matches: Vec<MatchOut>,
    pub standings: Vec<StandingRow>,
}

// ---------- request types ----------

#[derive(Debug, Deserialize)]
pub struct CreateTournamentRequest {
    pub name: String,
    /// "points" | "elimination"
    pub format: String,
    #[serde(default)]
    pub team_mode: bool,
    #[serde(default)]
    pub team_size: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTournamentRequest {
    pub team_mode: bool,
    #[serde(default)]
    pub team_size: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct AddParticipantRequest {
    /// Guest entry (name only). Mutually exclusive with `user_id`/`user_ids`.
    #[serde(default)]
    pub display_name: Option<String>,
    /// Single member.
    #[serde(default)]
    pub user_id: Option<Uuid>,
    /// Bulk add (used by the "add all members" button). Members already in
    /// the tournament are skipped.
    #[serde(default)]
    pub user_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateParticipantRequest {
    /// `Some(Some(team))` assigns, `Some(None)` clears (back to the bench),
    /// `None` leaves unchanged.
    #[serde(default, deserialize_with = "deserialize_optional_uuid")]
    pub team_id: Option<Option<Uuid>>,
}

fn deserialize_optional_uuid<'de, D>(de: D) -> Result<Option<Option<Uuid>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Ok(Some(Option::<Uuid>::deserialize(de)?))
}

#[derive(Debug, Deserialize)]
pub struct TeamRequest {
    #[serde(default)]
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SubmitResultRequest {
    /// Which side won: "a", "b" or "draw" (draw only allowed for points format).
    pub winner: String,
}

// ---------- db rows ----------

#[derive(sqlx::FromRow)]
struct TournamentRow {
    id: Uuid,
    group_id: Uuid,
    name: String,
    format: String,
    team_mode: bool,
    team_size: Option<i32>,
    status: String,
    created_by: Uuid,
    created_at: DateTime<Utc>,
}

// ---------- handlers ----------

pub async fn list_tournaments(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Vec<TournamentSummary>>> {
    ensure_member(&state, group_id, user.id).await?;
    let rows: Vec<(
        Uuid,
        String,
        String,
        bool,
        Option<i32>,
        String,
        i64,
        DateTime<Utc>,
    )> = sqlx::query_as(
        "SELECT t.id, t.name, t.format, t.team_mode, t.team_size, t.status,
                    (SELECT COUNT(*) FROM tournament_participants p WHERE p.tournament_id = t.id)
                        AS participant_count,
                    t.created_at
             FROM tournaments t
             WHERE t.group_id = $1
             ORDER BY t.created_at DESC",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let out = rows
        .into_iter()
        .map(
            |(id, name, format, team_mode, team_size, status, participant_count, created_at)| {
                TournamentSummary {
                    id,
                    name,
                    format,
                    team_mode,
                    team_size,
                    status,
                    participant_count,
                    created_at,
                }
            },
        )
        .collect();
    Ok(Json(out))
}

pub async fn create_tournament(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreateTournamentRequest>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;

    let name = payload.name.trim();
    if name.is_empty() || name.chars().count() > 120 {
        return Err(AppError::BadRequest(
            "name must be between 1 and 120 characters".into(),
        ));
    }
    let format = match payload.format.as_str() {
        "points" | "elimination" => payload.format.as_str(),
        _ => {
            return Err(AppError::BadRequest(
                "format must be 'points' or 'elimination'".into(),
            ))
        }
    };
    if let Some(size) = payload.team_size {
        if !(1..=50).contains(&size) {
            return Err(AppError::BadRequest(
                "team_size must be between 1 and 50".into(),
            ));
        }
    }
    let team_size = if payload.team_mode {
        Some(payload.team_size.unwrap_or(2))
    } else {
        None
    };

    let id: (Uuid,) = sqlx::query_as(
        "INSERT INTO tournaments (group_id, name, format, team_mode, team_size, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id",
    )
    .bind(group_id)
    .bind(name)
    .bind(format)
    .bind(payload.team_mode)
    .bind(team_size)
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(fetch_detail(&state.db, group_id, id.0).await?))
}

pub async fn get_tournament(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

/// Toggle team mode (and team size) while a tournament is still in setup.
/// Disabling team mode clears the team assignments and removes the teams.
pub async fn update_tournament(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateTournamentRequest>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;

    if let Some(size) = payload.team_size {
        if !(1..=50).contains(&size) {
            return Err(AppError::BadRequest(
                "team_size must be between 1 and 50".into(),
            ));
        }
    }
    let team_size = if payload.team_mode {
        Some(payload.team_size.unwrap_or(t.team_size.unwrap_or(2)))
    } else {
        None
    };

    sqlx::query("UPDATE tournaments SET team_mode = $1, team_size = $2 WHERE id = $3")
        .bind(payload.team_mode)
        .bind(team_size)
        .bind(tid)
        .execute(&state.db)
        .await?;

    // Turning teams off removes any teams (clears participant.team_id via the
    // ON DELETE SET NULL foreign key) so nothing stale lingers.
    if !payload.team_mode {
        sqlx::query("DELETE FROM tournament_teams WHERE tournament_id = $1")
            .bind(tid)
            .execute(&state.db)
            .await?;
    }

    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn delete_tournament(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    ensure_member(&state, group_id, user.id).await?;
    load_tournament(&state.db, group_id, tid).await?;
    sqlx::query("DELETE FROM tournaments WHERE id = $1")
        .bind(tid)
        .execute(&state.db)
        .await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn add_participant(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid)): Path<(Uuid, Uuid)>,
    Json(payload): Json<AddParticipantRequest>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;

    let next_pos = next_participant_position(&state.db, tid).await?;

    if let Some(name) = payload.display_name.as_ref() {
        let trimmed = name.trim();
        if trimmed.is_empty() || trimmed.chars().count() > 80 {
            return Err(AppError::BadRequest(
                "guest name must be between 1 and 80 characters".into(),
            ));
        }
        sqlx::query(
            "INSERT INTO tournament_participants (tournament_id, display_name, position)
             VALUES ($1, $2, $3)",
        )
        .bind(tid)
        .bind(trimmed)
        .bind(next_pos)
        .execute(&state.db)
        .await?;
    } else {
        // member(s): a single user_id and/or a bulk user_ids list.
        let mut ids: Vec<Uuid> = Vec::new();
        if let Some(uid) = payload.user_id {
            ids.push(uid);
        }
        if let Some(list) = payload.user_ids {
            ids.extend(list);
        }
        if ids.is_empty() {
            return Err(AppError::BadRequest(
                "provide display_name, user_id or user_ids".into(),
            ));
        }
        let mut pos = next_pos;
        for uid in ids {
            // Resolve display name and validate group membership.
            let member: Option<(String,)> = sqlx::query_as(
                "SELECT u.display_name
                 FROM users u
                 INNER JOIN group_members gm ON gm.user_id = u.id AND gm.group_id = $2
                 WHERE u.id = $1",
            )
            .bind(uid)
            .bind(group_id)
            .fetch_optional(&state.db)
            .await?;
            let Some((display_name,)) = member else {
                return Err(AppError::BadRequest(
                    "user is not a member of this group".into(),
                ));
            };
            // Skip members already present in the tournament.
            let exists: Option<(Uuid,)> = sqlx::query_as(
                "SELECT id FROM tournament_participants
                 WHERE tournament_id = $1 AND user_id = $2",
            )
            .bind(tid)
            .bind(uid)
            .fetch_optional(&state.db)
            .await?;
            if exists.is_some() {
                continue;
            }
            sqlx::query(
                "INSERT INTO tournament_participants
                    (tournament_id, user_id, display_name, position)
                 VALUES ($1, $2, $3, $4)",
            )
            .bind(tid)
            .bind(uid)
            .bind(&display_name)
            .bind(pos)
            .execute(&state.db)
            .await?;
            pos += 1;
        }
    }

    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn update_participant(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid, pid)): Path<(Uuid, Uuid, Uuid)>,
    Json(payload): Json<UpdateParticipantRequest>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;

    // Participant must belong to this tournament.
    let exists: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM tournament_participants WHERE id = $1 AND tournament_id = $2",
    )
    .bind(pid)
    .bind(tid)
    .fetch_optional(&state.db)
    .await?;
    if exists.is_none() {
        return Err(AppError::NotFound("participant not found".into()));
    }

    if let Some(team_opt) = payload.team_id {
        if let Some(team_id) = team_opt {
            let team: Option<(Uuid,)> = sqlx::query_as(
                "SELECT id FROM tournament_teams WHERE id = $1 AND tournament_id = $2",
            )
            .bind(team_id)
            .bind(tid)
            .fetch_optional(&state.db)
            .await?;
            if team.is_none() {
                return Err(AppError::BadRequest("team not found".into()));
            }
        }
        sqlx::query("UPDATE tournament_participants SET team_id = $1 WHERE id = $2")
            .bind(team_opt)
            .bind(pid)
            .execute(&state.db)
            .await?;
    }

    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn remove_participant(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid, pid)): Path<(Uuid, Uuid, Uuid)>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;
    sqlx::query("DELETE FROM tournament_participants WHERE id = $1 AND tournament_id = $2")
        .bind(pid)
        .bind(tid)
        .execute(&state.db)
        .await?;
    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn create_team(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid)): Path<(Uuid, Uuid)>,
    Json(payload): Json<TeamRequest>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;
    if !t.team_mode {
        return Err(AppError::BadRequest(
            "teams are disabled for this tournament".into(),
        ));
    }
    let pos = next_team_position(&state.db, tid).await?;
    let name = payload
        .name
        .as_ref()
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| format!("Team {}", pos + 1));
    sqlx::query("INSERT INTO tournament_teams (tournament_id, name, position) VALUES ($1, $2, $3)")
        .bind(tid)
        .bind(name)
        .bind(pos)
        .execute(&state.db)
        .await?;
    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn update_team(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid, team_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(payload): Json<TeamRequest>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;
    if let Some(name) = payload.name.as_ref() {
        let trimmed = name.trim();
        if trimmed.is_empty() || trimmed.chars().count() > 80 {
            return Err(AppError::BadRequest(
                "team name must be between 1 and 80 characters".into(),
            ));
        }
        let res = sqlx::query(
            "UPDATE tournament_teams SET name = $1 WHERE id = $2 AND tournament_id = $3",
        )
        .bind(trimmed)
        .bind(team_id)
        .bind(tid)
        .execute(&state.db)
        .await?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound("team not found".into()));
        }
    }
    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn delete_team(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid, team_id)): Path<(Uuid, Uuid, Uuid)>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;
    // Members of the team fall back to the bench (FK ON DELETE SET NULL).
    sqlx::query("DELETE FROM tournament_teams WHERE id = $1 AND tournament_id = $2")
        .bind(team_id)
        .bind(tid)
        .execute(&state.db)
        .await?;
    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn randomize(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;
    if !t.team_mode {
        return Err(AppError::BadRequest(
            "teams are disabled for this tournament".into(),
        ));
    }
    let team_size = t.team_size.unwrap_or(2).max(1);

    // Load participants and shuffle them.
    let mut participant_ids: Vec<Uuid> = sqlx::query_as::<_, (Uuid,)>(
        "SELECT id FROM tournament_participants WHERE tournament_id = $1",
    )
    .bind(tid)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id,)| id)
    .collect();
    if participant_ids.is_empty() {
        return Err(AppError::BadRequest(
            "add participants before randomizing teams".into(),
        ));
    }
    participant_ids.shuffle(&mut rand::thread_rng());

    let n = participant_ids.len() as i32;
    // floor(n / size), at least one team. Leftovers are dealt out round-robin
    // so some teams end up one player larger.
    let num_teams = std::cmp::max(1, n / team_size) as usize;

    // Wipe existing teams (clears participant.team_id via ON DELETE SET NULL),
    // then create a fresh set.
    sqlx::query("DELETE FROM tournament_teams WHERE tournament_id = $1")
        .bind(tid)
        .execute(&state.db)
        .await?;

    let mut team_ids: Vec<Uuid> = Vec::with_capacity(num_teams);
    for i in 0..num_teams {
        let team: (Uuid,) = sqlx::query_as(
            "INSERT INTO tournament_teams (tournament_id, name, position)
             VALUES ($1, $2, $3) RETURNING id",
        )
        .bind(tid)
        .bind(format!("Team {}", i + 1))
        .bind(i as i32)
        .fetch_one(&state.db)
        .await?;
        team_ids.push(team.0);
    }

    for (i, pid) in participant_ids.iter().enumerate() {
        let team_id = team_ids[i % num_teams];
        sqlx::query("UPDATE tournament_participants SET team_id = $1 WHERE id = $2")
            .bind(team_id)
            .bind(pid)
            .execute(&state.db)
            .await?;
    }

    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn start(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    ensure_setup(&t)?;

    // Materialise entrants: one per team (team mode) or one per participant.
    let entrants: Vec<(Uuid, String)> = if t.team_mode {
        // Only teams that have at least one member compete.
        sqlx::query_as(
            "SELECT tt.id, tt.name
             FROM tournament_teams tt
             WHERE tt.tournament_id = $1
               AND EXISTS (SELECT 1 FROM tournament_participants p WHERE p.team_id = tt.id)
             ORDER BY tt.position",
        )
        .bind(tid)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT id, display_name FROM tournament_participants
             WHERE tournament_id = $1 ORDER BY position",
        )
        .bind(tid)
        .fetch_all(&state.db)
        .await?
    };

    if entrants.len() < 2 {
        return Err(AppError::BadRequest(
            "need at least two entrants to start".into(),
        ));
    }

    // Shuffle for random seeding.
    let mut seeded = entrants;
    seeded.shuffle(&mut rand::thread_rng());

    // Insert entrant rows.
    let mut entrant_ids: Vec<Uuid> = Vec::with_capacity(seeded.len());
    for (seed, (source_id, display_name)) in seeded.iter().enumerate() {
        let (kind, participant_id, team_id) = if t.team_mode {
            ("team", None, Some(*source_id))
        } else {
            ("participant", Some(*source_id), None)
        };
        let row: (Uuid,) = sqlx::query_as(
            "INSERT INTO tournament_entrants
                (tournament_id, kind, participant_id, team_id, display_name, seed)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        )
        .bind(tid)
        .bind(kind)
        .bind(participant_id)
        .bind(team_id)
        .bind(display_name)
        .bind(seed as i32)
        .fetch_one(&state.db)
        .await?;
        entrant_ids.push(row.0);
    }

    match t.format.as_str() {
        "points" => generate_round_robin(&state.db, tid, &entrant_ids).await?,
        "elimination" => generate_bracket(&state.db, tid, &entrant_ids).await?,
        _ => unreachable!("format validated on create"),
    }

    sqlx::query("UPDATE tournaments SET status = 'active' WHERE id = $1")
        .bind(tid)
        .execute(&state.db)
        .await?;

    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

pub async fn submit_result(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, tid, mid)): Path<(Uuid, Uuid, Uuid)>,
    Json(payload): Json<SubmitResultRequest>,
) -> AppResult<Json<TournamentDetail>> {
    ensure_member(&state, group_id, user.id).await?;
    let t = load_tournament(&state.db, group_id, tid).await?;
    if t.status == "setup" {
        return Err(AppError::BadRequest(
            "start the tournament before entering results".into(),
        ));
    }
    let choice = payload.winner.as_str();
    if !matches!(choice, "a" | "b" | "draw") {
        return Err(AppError::BadRequest(
            "winner must be 'a', 'b' or 'draw'".into(),
        ));
    }

    let m: Option<(Option<Uuid>, Option<Uuid>, Option<Uuid>, Option<String>)> = sqlx::query_as(
        "SELECT entrant_a_id, entrant_b_id, next_match_id, next_slot
         FROM tournament_matches WHERE id = $1 AND tournament_id = $2",
    )
    .bind(mid)
    .bind(tid)
    .fetch_optional(&state.db)
    .await?;
    let Some((entrant_a, entrant_b, next_match_id, next_slot)) = m else {
        return Err(AppError::NotFound("match not found".into()));
    };

    if entrant_a.is_none() || entrant_b.is_none() {
        return Err(AppError::BadRequest(
            "both entrants must be decided before entering a result".into(),
        ));
    }

    let winner = match choice {
        "a" => entrant_a,
        "b" => entrant_b,
        _ => {
            if t.format == "elimination" {
                return Err(AppError::BadRequest(
                    "an elimination match cannot end in a draw".into(),
                ));
            }
            None
        }
    };

    sqlx::query(
        "UPDATE tournament_matches
         SET score_a = NULL, score_b = NULL, winner_entrant_id = $1, status = 'done'
         WHERE id = $2",
    )
    .bind(winner)
    .bind(mid)
    .execute(&state.db)
    .await?;

    // Advance the winner in an elimination bracket.
    if t.format == "elimination" {
        if let (Some(next_id), Some(slot), Some(winner_id)) =
            (next_match_id, next_slot.as_deref(), winner)
        {
            let column = if slot == "a" {
                "entrant_a_id"
            } else {
                "entrant_b_id"
            };
            let sql = format!("UPDATE tournament_matches SET {column} = $1 WHERE id = $2");
            sqlx::query(&sql)
                .bind(winner_id)
                .bind(next_id)
                .execute(&state.db)
                .await?;
        }
    }

    // Mark complete once every match has a result.
    let pending: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = $1 AND status = 'pending'",
    )
    .bind(tid)
    .fetch_one(&state.db)
    .await?;
    let new_status = if pending.0 == 0 {
        "completed"
    } else {
        "active"
    };
    sqlx::query("UPDATE tournaments SET status = $1 WHERE id = $2")
        .bind(new_status)
        .bind(tid)
        .execute(&state.db)
        .await?;

    Ok(Json(fetch_detail(&state.db, group_id, tid).await?))
}

// ---------- match generation ----------

/// Round-robin (every entrant plays every other once) using the circle
/// method so matches are spread across sensible rounds.
async fn generate_round_robin(pool: &PgPool, tid: Uuid, entrants: &[Uuid]) -> AppResult<()> {
    // Sentinel index for the bye when the entrant count is odd.
    const BYE: usize = usize::MAX;
    let mut players: Vec<usize> = (0..entrants.len()).collect();
    if players.len() % 2 == 1 {
        players.push(BYE);
    }
    let m = players.len();
    let rounds = m - 1;
    let half = m / 2;

    for round in 0..rounds {
        let mut match_index = 0;
        for i in 0..half {
            let a = players[i];
            let b = players[m - 1 - i];
            if a == BYE || b == BYE {
                continue;
            }
            sqlx::query(
                "INSERT INTO tournament_matches
                    (tournament_id, round, match_index, entrant_a_id, entrant_b_id)
                 VALUES ($1, $2, $3, $4, $5)",
            )
            .bind(tid)
            .bind((round + 1) as i32)
            .bind(match_index)
            .bind(entrants[a])
            .bind(entrants[b])
            .execute(pool)
            .await?;
            match_index += 1;
        }
        // Rotate everyone but the first player.
        let last = players.remove(m - 1);
        players.insert(1, last);
    }
    Ok(())
}

/// Single-elimination bracket. Pads to the next power of two with byes,
/// seeds with the standard bracket order (so byes face the top seeds and
/// never each other), creates every round up front and links matches via
/// `next_match_id` / `next_slot`. Byes auto-advance immediately.
async fn generate_bracket(pool: &PgPool, tid: Uuid, entrants: &[Uuid]) -> AppResult<()> {
    let n = entrants.len();
    let mut size = 1usize;
    while size < n {
        size *= 2;
    }
    let total_rounds = size.trailing_zeros() as i32; // log2(size)
    let order = seed_order(size); // 1-based seed positions

    // Pre-generate ids for every match, indexed by [round][match_index].
    let mut ids: Vec<Vec<Uuid>> = Vec::new();
    for r in 0..total_rounds {
        let count = size >> (r + 1);
        ids.push((0..count).map(|_| Uuid::new_v4()).collect());
    }

    // In-memory match state so we can resolve round-1 byes before inserting.
    struct M {
        a: Option<Uuid>,
        b: Option<Uuid>,
        winner: Option<Uuid>,
        status: &'static str,
        next_id: Option<Uuid>,
        next_slot: Option<&'static str>,
    }
    let mut rounds: Vec<Vec<M>> = Vec::new();
    for r in 0..total_rounds as usize {
        let count = size >> (r + 1);
        let mut row = Vec::with_capacity(count);
        for idx in 0..count {
            let (next_id, next_slot) = if r + 1 < total_rounds as usize {
                let n_idx = idx / 2;
                let slot = if idx % 2 == 0 { "a" } else { "b" };
                (Some(ids[r + 1][n_idx]), Some(slot))
            } else {
                (None, None)
            };
            row.push(M {
                a: None,
                b: None,
                winner: None,
                status: "pending",
                next_id,
                next_slot,
            });
        }
        rounds.push(row);
    }

    // Seat seeds into round 1. `order` pairs slots (0,1), (2,3), ...
    let entrant_for = |seed_num: usize| -> Option<Uuid> {
        if seed_num >= 1 && seed_num <= n {
            Some(entrants[seed_num - 1])
        } else {
            None
        }
    };
    for (idx, m) in rounds[0].iter_mut().enumerate() {
        m.a = entrant_for(order[idx * 2]);
        m.b = entrant_for(order[idx * 2 + 1]);
    }

    // Resolve byes in round 1: a match with exactly one entrant auto-advances
    // into round 2. With proper seeding byes only occur in round 1 and never
    // face each other, so a single forward pass is enough.
    for idx in 0..rounds[0].len() {
        let (a, b) = {
            let m = &rounds[0][idx];
            (m.a, m.b)
        };
        let advancing = match (a, b) {
            (Some(x), None) => Some(x),
            (None, Some(x)) => Some(x),
            _ => None,
        };
        if let Some(winner) = advancing {
            {
                let m = &mut rounds[0][idx];
                m.winner = Some(winner);
                m.status = "done";
            }
            // Round-1 match idx feeds round-2 match idx/2, slot a/b by parity.
            if total_rounds as usize > 1 {
                let target = &mut rounds[1][idx / 2];
                if idx % 2 == 0 {
                    target.a = Some(winner);
                } else {
                    target.b = Some(winner);
                }
            }
        }
    }

    // Persist every match. Insert later rounds first so that a match's
    // `next_match_id` always references an already-inserted row (the FK is
    // checked immediately).
    for r in (0..rounds.len()).rev() {
        let row = &rounds[r];
        for (idx, m) in row.iter().enumerate() {
            sqlx::query(
                "INSERT INTO tournament_matches
                    (id, tournament_id, round, match_index, entrant_a_id, entrant_b_id,
                     winner_entrant_id, status, next_match_id, next_slot)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            )
            .bind(ids[r][idx])
            .bind(tid)
            .bind((r + 1) as i32)
            .bind(idx as i32)
            .bind(m.a)
            .bind(m.b)
            .bind(m.winner)
            .bind(m.status)
            .bind(m.next_id)
            .bind(m.next_slot)
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::seed_order;

    #[test]
    fn seed_order_matches_standard_brackets() {
        assert_eq!(seed_order(2), vec![1, 2]);
        assert_eq!(seed_order(4), vec![1, 4, 2, 3]);
        assert_eq!(seed_order(8), vec![1, 8, 4, 5, 2, 7, 3, 6]);
    }

    #[test]
    fn seed_order_is_a_valid_bracket() {
        for &size in &[2usize, 4, 8, 16, 32] {
            let order = seed_order(size);
            assert_eq!(order.len(), size);
            // Every seed 1..=size appears exactly once.
            let mut sorted = order.clone();
            sorted.sort_unstable();
            assert_eq!(sorted, (1..=size).collect::<Vec<_>>());
            // Each first-round pair sums to size + 1, so the top seed always
            // faces the lowest seed (a bye when that seed exceeds the field).
            for pair in order.chunks(2) {
                assert_eq!(pair[0] + pair[1], size + 1);
            }
        }
    }
}

/// Standard single-elimination seeding order for a bracket of `size`
/// (a power of two). Returns 1-based seed positions; pairs are consecutive.
fn seed_order(size: usize) -> Vec<usize> {
    let mut order = vec![1usize, 2];
    while order.len() < size {
        let m = order.len() * 2 + 1;
        let mut next = Vec::with_capacity(order.len() * 2);
        for &s in &order {
            next.push(s);
            next.push(m - s);
        }
        order = next;
    }
    order
}

// ---------- detail assembly + standings ----------

async fn load_tournament(pool: &PgPool, group_id: Uuid, tid: Uuid) -> AppResult<TournamentRow> {
    let row: Option<TournamentRow> = sqlx::query_as(
        "SELECT id, group_id, name, format, team_mode, team_size, status, created_by, created_at
         FROM tournaments WHERE id = $1 AND group_id = $2",
    )
    .bind(tid)
    .bind(group_id)
    .fetch_optional(pool)
    .await?;
    row.ok_or_else(|| AppError::NotFound("tournament not found".into()))
}

fn ensure_setup(t: &TournamentRow) -> AppResult<()> {
    if t.status != "setup" {
        return Err(AppError::BadRequest(
            "this tournament has already started".into(),
        ));
    }
    Ok(())
}

async fn next_participant_position(pool: &PgPool, tid: Uuid) -> AppResult<i32> {
    let row: (Option<i32>,) = sqlx::query_as(
        "SELECT MAX(position) FROM tournament_participants WHERE tournament_id = $1",
    )
    .bind(tid)
    .fetch_one(pool)
    .await?;
    Ok(row.0.map(|p| p + 1).unwrap_or(0))
}

async fn next_team_position(pool: &PgPool, tid: Uuid) -> AppResult<i32> {
    let row: (Option<i32>,) =
        sqlx::query_as("SELECT MAX(position) FROM tournament_teams WHERE tournament_id = $1")
            .bind(tid)
            .fetch_one(pool)
            .await?;
    Ok(row.0.map(|p| p + 1).unwrap_or(0))
}

async fn fetch_detail(pool: &PgPool, group_id: Uuid, tid: Uuid) -> AppResult<TournamentDetail> {
    let t = load_tournament(pool, group_id, tid).await?;

    let participants: Vec<ParticipantOut> =
        sqlx::query_as::<_, (Uuid, Option<Uuid>, String, Option<Uuid>, i32)>(
            "SELECT id, user_id, display_name, team_id, position
         FROM tournament_participants WHERE tournament_id = $1 ORDER BY position",
        )
        .bind(tid)
        .fetch_all(pool)
        .await?
        .into_iter()
        .map(
            |(id, user_id, display_name, team_id, position)| ParticipantOut {
                id,
                user_id,
                display_name,
                team_id,
                position,
            },
        )
        .collect();

    let team_rows: Vec<(Uuid, String, i32)> = sqlx::query_as(
        "SELECT id, name, position FROM tournament_teams WHERE tournament_id = $1 ORDER BY position",
    )
    .bind(tid)
    .fetch_all(pool)
    .await?;
    let teams: Vec<TeamOut> = team_rows
        .into_iter()
        .map(|(id, name, position)| TeamOut {
            id,
            name,
            position,
            member_ids: participants
                .iter()
                .filter(|p| p.team_id == Some(id))
                .map(|p| p.id)
                .collect(),
        })
        .collect();

    let entrants: Vec<EntrantOut> =
        sqlx::query_as::<_, (Uuid, String, Option<Uuid>, Option<Uuid>, String, i32)>(
            "SELECT id, kind, participant_id, team_id, display_name, seed
         FROM tournament_entrants WHERE tournament_id = $1 ORDER BY seed",
        )
        .bind(tid)
        .fetch_all(pool)
        .await?
        .into_iter()
        .map(
            |(id, kind, participant_id, team_id, display_name, seed)| EntrantOut {
                id,
                kind,
                participant_id,
                team_id,
                display_name,
                seed,
            },
        )
        .collect();

    let matches: Vec<MatchOut> = sqlx::query_as::<
        _,
        (
            Uuid,
            i32,
            i32,
            Option<Uuid>,
            Option<Uuid>,
            Option<i32>,
            Option<i32>,
            Option<Uuid>,
            String,
            Option<Uuid>,
            Option<String>,
        ),
    >(
        "SELECT id, round, match_index, entrant_a_id, entrant_b_id, score_a, score_b,
                winner_entrant_id, status, next_match_id, next_slot
         FROM tournament_matches WHERE tournament_id = $1
         ORDER BY round, match_index",
    )
    .bind(tid)
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(
        |(
            id,
            round,
            match_index,
            entrant_a_id,
            entrant_b_id,
            score_a,
            score_b,
            winner_entrant_id,
            status,
            next_match_id,
            next_slot,
        )| MatchOut {
            id,
            round,
            match_index,
            entrant_a_id,
            entrant_b_id,
            score_a,
            score_b,
            winner_entrant_id,
            status,
            next_match_id,
            next_slot,
        },
    )
    .collect();

    let standings = if t.format == "points" {
        compute_standings(&entrants, &matches)
    } else {
        Vec::new()
    };

    Ok(TournamentDetail {
        id: t.id,
        group_id: t.group_id,
        name: t.name,
        format: t.format,
        team_mode: t.team_mode,
        team_size: t.team_size,
        status: t.status,
        created_by: t.created_by,
        created_at: t.created_at,
        participants,
        teams,
        entrants,
        matches,
        standings,
    })
}

/// League table for a round-robin: win = 3, draw = 1, loss = 0. Results only
/// record who won (or a draw), so ranking is by points, then wins, then name.
fn compute_standings(entrants: &[EntrantOut], matches: &[MatchOut]) -> Vec<StandingRow> {
    let mut rows: Vec<StandingRow> = entrants
        .iter()
        .map(|e| StandingRow {
            entrant_id: e.id,
            display_name: e.display_name.clone(),
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
        })
        .collect();

    let index_of: std::collections::HashMap<Uuid, usize> = rows
        .iter()
        .enumerate()
        .map(|(i, r)| (r.entrant_id, i))
        .collect();

    for m in matches {
        if m.status != "done" {
            continue;
        }
        let (Some(a), Some(b)) = (m.entrant_a_id, m.entrant_b_id) else {
            continue;
        };
        let (Some(&ia), Some(&ib)) = (index_of.get(&a), index_of.get(&b)) else {
            continue;
        };
        rows[ia].played += 1;
        rows[ib].played += 1;
        match m.winner_entrant_id {
            Some(w) if w == a => {
                rows[ia].wins += 1;
                rows[ia].points += 3;
                rows[ib].losses += 1;
            }
            Some(w) if w == b => {
                rows[ib].wins += 1;
                rows[ib].points += 3;
                rows[ia].losses += 1;
            }
            _ => {
                // No winner recorded => draw.
                rows[ia].draws += 1;
                rows[ib].draws += 1;
                rows[ia].points += 1;
                rows[ib].points += 1;
            }
        }
    }

    rows.sort_by(|x, y| {
        y.points.cmp(&x.points).then(y.wins.cmp(&x.wins)).then(
            x.display_name
                .to_lowercase()
                .cmp(&y.display_name.to_lowercase()),
        )
    });
    rows
}
