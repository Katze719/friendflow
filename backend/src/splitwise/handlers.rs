use std::collections::HashMap;

use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    error::{AppError, AppResult},
    groups::ensure_member,
    state::AppState,
};

// ---------- response models ----------

#[derive(Debug, Serialize)]
pub struct Balance {
    pub user_id: Uuid,
    pub display_name: String,
    pub balance_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct Settlement {
    pub from_user_id: Uuid,
    pub from_display_name: String,
    pub to_user_id: Uuid,
    pub to_display_name: String,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct Summary {
    pub currency: String,
    pub balances: Vec<Balance>,
    /// Minimum-transaction plan: greedy bipartite matching of creditors and
    /// debtors. A debtor may settle with somebody they never personally owed
    /// anything to.
    pub settlements: Vec<Settlement>,
    /// Pairwise debts as they actually arose from expenses, netted within
    /// each pair. Nobody ends up paying somebody they never owed anything to.
    pub direct_settlements: Vec<Settlement>,
    pub my_balance_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct ExpenseSplit {
    pub user_id: Uuid,
    pub display_name: String,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize)]
pub struct Expense {
    pub id: Uuid,
    pub group_id: Uuid,
    pub paid_by: Uuid,
    pub paid_by_display_name: String,
    pub description: String,
    pub amount_cents: i64,
    pub happened_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    /// Optional link to a trip in the same group. When set, this expense
    /// contributes to that trip's budget widget. `None` means it's a normal
    /// group-level expense.
    pub trip_id: Option<Uuid>,
    pub trip_name: Option<String>,
    pub splits: Vec<ExpenseSplit>,
}

#[derive(Debug, Serialize)]
pub struct Payment {
    pub id: Uuid,
    pub group_id: Uuid,
    pub from_user_id: Uuid,
    pub from_display_name: String,
    pub to_user_id: Uuid,
    pub to_display_name: String,
    pub amount_cents: i64,
    pub note: Option<String>,
    pub happened_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

// ---------- request models ----------

#[derive(Debug, Deserialize)]
pub struct SplitInput {
    pub user_id: Uuid,
    pub amount_cents: i64,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateExpenseRequest {
    #[validate(length(min = 1, max = 200))]
    pub description: String,
    #[validate(range(min = 1))]
    pub amount_cents: i64,
    pub paid_by: Uuid,
    pub happened_at: Option<DateTime<Utc>>,
    pub splits: Vec<SplitInput>,
    #[serde(default)]
    pub trip_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateExpenseRequest {
    #[validate(length(min = 1, max = 200))]
    pub description: String,
    #[validate(range(min = 1))]
    pub amount_cents: i64,
    pub paid_by: Uuid,
    pub happened_at: Option<DateTime<Utc>>,
    pub splits: Vec<SplitInput>,
    #[serde(default)]
    pub trip_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePaymentRequest {
    pub from_user: Uuid,
    pub to_user: Uuid,
    #[validate(range(min = 1))]
    pub amount_cents: i64,
    #[validate(length(max = 200))]
    pub note: Option<String>,
    pub happened_at: Option<DateTime<Utc>>,
}

// ---------- helpers ----------

/// Net pairwise debts: for every pair (i, j), the amount i currently owes j
/// (because j paid for something i participated in) cancels out against
/// whatever j owes i. The direction and remainder of the winner is kept.
/// Self-debts (paid_by == user) are ignored.
fn net_direct_debts(raw: &[(Uuid, Uuid, i64)]) -> Vec<(Uuid, Uuid, i64)> {
    // raw: (debtor, creditor, amount) - "debtor owes creditor `amount`".
    let mut pair: HashMap<(Uuid, Uuid), i64> = HashMap::new();
    for &(debtor, creditor, amount) in raw {
        if debtor == creditor || amount == 0 {
            continue;
        }
        // Normalise the pair so opposing directions cancel out.
        let (a, b, signed) = if debtor < creditor {
            (debtor, creditor, amount)
        } else {
            (creditor, debtor, -amount)
        };
        *pair.entry((a, b)).or_insert(0) += signed;
    }
    let mut out: Vec<(Uuid, Uuid, i64)> = pair
        .into_iter()
        .filter_map(|((a, b), net)| match net.cmp(&0) {
            std::cmp::Ordering::Greater => Some((a, b, net)),
            std::cmp::Ordering::Less => Some((b, a, -net)),
            std::cmp::Ordering::Equal => None,
        })
        .collect();
    // Stable ordering so the UI doesn't shuffle on every reload.
    out.sort_by(|x, y| y.2.cmp(&x.2).then(x.0.cmp(&y.0)).then(x.1.cmp(&y.1)));
    out
}

/// Greedy settlement: at each step, match the largest creditor with the
/// largest debtor until every balance is zero. Produces at most N-1
/// transactions and is good enough for small friend groups.
fn simplify_debts(balances: &[(Uuid, i64)]) -> Vec<(Uuid, Uuid, i64)> {
    let mut entries: Vec<(Uuid, i64)> = balances.iter().copied().filter(|(_, b)| *b != 0).collect();
    let mut out = Vec::new();
    loop {
        entries.retain(|(_, b)| *b != 0);
        if entries.is_empty() {
            break;
        }
        entries.sort_by_key(|(_, b)| *b);
        let (debtor_id, debtor_balance) = entries.first().copied().unwrap();
        let (creditor_id, creditor_balance) = entries.last().copied().unwrap();
        if debtor_balance >= 0 || creditor_balance <= 0 {
            break;
        }
        let amount = (-debtor_balance).min(creditor_balance);
        out.push((debtor_id, creditor_id, amount));
        if let Some(e) = entries.iter_mut().find(|(u, _)| *u == debtor_id) {
            e.1 += amount;
        }
        if let Some(e) = entries.iter_mut().find(|(u, _)| *u == creditor_id) {
            e.1 -= amount;
        }
    }
    out
}

// ---------- handlers ----------

pub async fn summary(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Summary>> {
    ensure_member(&state, group_id, user.id).await?;

    let group_currency: (String,) = sqlx::query_as("SELECT currency FROM groups WHERE id = $1")
        .bind(group_id)
        .fetch_one(&state.db)
        .await?;

    let members: Vec<(Uuid, String)> = sqlx::query_as(
        "SELECT gp.id,
                CASE WHEN gp.kind = 'member' THEN COALESCE(u.display_name, gp.display_name)
                     ELSE gp.display_name END
         FROM group_people gp
         LEFT JOIN users u ON u.id = gp.user_id
         WHERE gp.group_id = $1
         ORDER BY lower(CASE WHEN gp.kind = 'member' THEN COALESCE(u.display_name, gp.display_name) ELSE gp.display_name END)",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;
    let active_ids: std::collections::HashSet<Uuid> = sqlx::query_as::<_, (Uuid,)>(
        "SELECT id FROM group_people WHERE group_id = $1 AND active = TRUE",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id,)| id)
    .collect();

    let paid_rows: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT paid_by, COALESCE(SUM(amount_cents), 0)::BIGINT
         FROM expenses WHERE group_id = $1 GROUP BY paid_by",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let owed_rows: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT es.user_id, COALESCE(SUM(es.amount_cents), 0)::BIGINT
         FROM expense_splits es
         INNER JOIN expenses e ON e.id = es.expense_id
         WHERE e.group_id = $1
         GROUP BY es.user_id",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let mut paid: HashMap<Uuid, i64> = HashMap::new();
    for (u, v) in paid_rows {
        paid.insert(u, v);
    }
    let mut owed: HashMap<Uuid, i64> = HashMap::new();
    for (u, v) in owed_rows {
        owed.insert(u, v);
    }

    // Payments sent by / received by each user. A payment from X to Y
    // settles X's debt to Y, so it moves X's balance up and Y's down.
    let sent_rows: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT from_user, COALESCE(SUM(amount_cents), 0)::BIGINT
         FROM splitwise_payments WHERE group_id = $1 GROUP BY from_user",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;
    let received_rows: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT to_user, COALESCE(SUM(amount_cents), 0)::BIGINT
         FROM splitwise_payments WHERE group_id = $1 GROUP BY to_user",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;
    let mut sent: HashMap<Uuid, i64> = HashMap::new();
    for (u, v) in sent_rows {
        sent.insert(u, v);
    }
    let mut received: HashMap<Uuid, i64> = HashMap::new();
    for (u, v) in received_rows {
        received.insert(u, v);
    }

    let balances: Vec<Balance> = members
        .iter()
        .map(|(id, display_name)| {
            let p = paid.get(id).copied().unwrap_or(0);
            let o = owed.get(id).copied().unwrap_or(0);
            let s = sent.get(id).copied().unwrap_or(0);
            let r = received.get(id).copied().unwrap_or(0);
            Balance {
                user_id: *id,
                display_name: display_name.clone(),
                balance_cents: p - o + s - r,
            }
        })
        .filter(|balance| balance.balance_cents != 0 || active_ids.contains(&balance.user_id))
        .collect();

    let my_balance_cents = balances
        .iter()
        .find(|b| b.user_id == user.id)
        .map(|b| b.balance_cents)
        .unwrap_or(0);

    let name_of: HashMap<Uuid, String> = members
        .iter()
        .map(|(id, name)| (*id, name.clone()))
        .collect();
    let pairs: Vec<(Uuid, i64)> = balances
        .iter()
        .map(|b| (b.user_id, b.balance_cents))
        .collect();

    let make_settlement = |(from, to, amount): (Uuid, Uuid, i64)| Settlement {
        from_user_id: from,
        from_display_name: name_of.get(&from).cloned().unwrap_or_default(),
        to_user_id: to,
        to_display_name: name_of.get(&to).cloned().unwrap_or_default(),
        amount_cents: amount,
    };

    let settlements: Vec<Settlement> = simplify_debts(&pairs)
        .into_iter()
        .map(make_settlement)
        .collect();

    // Pairwise raw debts derived from every expense: the payer is creditor,
    // every other participant is debtor for their share.
    let mut pair_rows: Vec<(Uuid, Uuid, i64)> = sqlx::query_as(
        "SELECT es.user_id AS debtor, e.paid_by AS creditor,
                COALESCE(SUM(es.amount_cents), 0)::BIGINT AS amount
         FROM expense_splits es
         INNER JOIN expenses e ON e.id = es.expense_id
         WHERE e.group_id = $1 AND es.user_id <> e.paid_by
         GROUP BY es.user_id, e.paid_by",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    // A payment from X to Y settles X's debt to Y. Feeding it as a negative
    // (debtor=X, creditor=Y, -amount) into the netting cancels the matching
    // debt; overpayments flip the pair automatically.
    let payment_pair_rows: Vec<(Uuid, Uuid, i64)> = sqlx::query_as(
        "SELECT from_user, to_user, COALESCE(SUM(amount_cents), 0)::BIGINT
         FROM splitwise_payments WHERE group_id = $1
         GROUP BY from_user, to_user",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;
    for (from, to, amount) in payment_pair_rows {
        pair_rows.push((from, to, -amount));
    }

    let direct_settlements: Vec<Settlement> = net_direct_debts(&pair_rows)
        .into_iter()
        .map(make_settlement)
        .collect();

    Ok(Json(Summary {
        currency: group_currency.0,
        balances,
        settlements,
        direct_settlements,
        my_balance_cents,
    }))
}

pub async fn list_expenses(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Vec<Expense>>> {
    ensure_member(&state, group_id, user.id).await?;

    let expense_rows: Vec<(
        Uuid,
        Uuid,
        String,
        i64,
        DateTime<Utc>,
        DateTime<Utc>,
        Uuid,
        String,
        Option<Uuid>,
        Option<String>,
    )> = sqlx::query_as(
        "SELECT e.id, e.group_id, e.description, e.amount_cents, e.happened_at, e.created_at,
                    e.paid_by,
                    CASE WHEN gp.kind = 'member' THEN COALESCE(u.display_name, gp.display_name) ELSE gp.display_name END,
                    e.trip_id, t.name
             FROM expenses e
             INNER JOIN group_people gp ON gp.group_id = e.group_id AND gp.id = e.paid_by
             LEFT JOIN users u ON u.id = gp.user_id
             LEFT JOIN trips t ON t.id = e.trip_id
             WHERE e.group_id = $1
             ORDER BY e.happened_at DESC, e.created_at DESC",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let split_rows: Vec<(Uuid, Uuid, String, i64)> = sqlx::query_as(
        "SELECT es.expense_id, es.user_id,
                CASE WHEN gp.kind = 'member' THEN COALESCE(u.display_name, gp.display_name) ELSE gp.display_name END,
                es.amount_cents
         FROM expense_splits es
         INNER JOIN expenses e ON e.id = es.expense_id
         INNER JOIN group_people gp ON gp.group_id = es.group_id AND gp.id = es.user_id
         LEFT JOIN users u ON u.id = gp.user_id
         WHERE e.group_id = $1",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let mut splits_by_expense: HashMap<Uuid, Vec<ExpenseSplit>> = HashMap::new();
    for (expense_id, user_id, display_name, amount_cents) in split_rows {
        splits_by_expense
            .entry(expense_id)
            .or_default()
            .push(ExpenseSplit {
                user_id,
                display_name,
                amount_cents,
            });
    }

    let out = expense_rows
        .into_iter()
        .map(
            |(
                id,
                group_id,
                description,
                amount_cents,
                happened_at,
                created_at,
                paid_by,
                paid_by_display_name,
                trip_id,
                trip_name,
            )| {
                Expense {
                    id,
                    group_id,
                    paid_by,
                    paid_by_display_name,
                    description,
                    amount_cents,
                    happened_at,
                    created_at,
                    trip_id,
                    trip_name,
                    splits: splits_by_expense.remove(&id).unwrap_or_default(),
                }
            },
        )
        .collect();

    Ok(Json(out))
}

/// Check that the optional `trip_id` references a trip belonging to the same
/// group as the expense being created/updated. Nothing to do if no trip was
/// provided; the caller still has to persist `None`.
async fn ensure_trip_in_group(
    state: &AppState,
    group_id: Uuid,
    trip_id: Option<Uuid>,
) -> AppResult<()> {
    let Some(trip_id) = trip_id else {
        return Ok(());
    };
    let row: Option<(Uuid,)> = sqlx::query_as("SELECT group_id FROM trips WHERE id = $1")
        .bind(trip_id)
        .fetch_optional(&state.db)
        .await?;
    let row = row.ok_or_else(|| AppError::NotFound("trip not found".into()))?;
    if row.0 != group_id {
        return Err(AppError::BadRequest(
            "trip does not belong to this group".into(),
        ));
    }
    Ok(())
}

/// Shared validation for create/update: splits must be non-empty, sum up to
/// `amount_cents`, non-negative, and every referenced id must be a person in
/// the group.
async fn validate_splits(
    state: &AppState,
    group_id: Uuid,
    amount_cents: i64,
    paid_by: Uuid,
    splits: &[SplitInput],
    allowed_inactive: &std::collections::HashSet<Uuid>,
) -> AppResult<()> {
    if splits.is_empty() {
        return Err(AppError::BadRequest("splits must not be empty".into()));
    }
    let total: i64 = splits.iter().map(|s| s.amount_cents).sum();
    if total != amount_cents {
        return Err(AppError::BadRequest(
            "sum of splits must equal amount_cents".into(),
        ));
    }
    for s in splits {
        if s.amount_cents < 0 {
            return Err(AppError::BadRequest("split amounts must be >= 0".into()));
        }
    }

    let unique_people: std::collections::HashSet<Uuid> =
        splits.iter().map(|split| split.user_id).collect();
    if unique_people.len() != splits.len() {
        return Err(AppError::BadRequest(
            "a person may only appear once in splits".into(),
        ));
    }

    let people: Vec<(Uuid, bool)> =
        sqlx::query_as("SELECT id, active FROM group_people WHERE group_id = $1")
            .bind(group_id)
            .fetch_all(&state.db)
            .await?;
    let people: std::collections::HashMap<Uuid, bool> = people.into_iter().collect();
    if !people.contains_key(&paid_by) {
        return Err(AppError::BadRequest(
            "paid_by is not a person in this group".into(),
        ));
    }
    if !people[&paid_by] && !allowed_inactive.contains(&paid_by) {
        return Err(AppError::BadRequest("paid_by person is archived".into()));
    }
    for s in splits {
        if !people.contains_key(&s.user_id) {
            return Err(AppError::BadRequest(
                "split person is not in this group".into(),
            ));
        }
        if !people[&s.user_id] && !allowed_inactive.contains(&s.user_id) {
            return Err(AppError::BadRequest("split person is archived".into()));
        }
    }
    Ok(())
}

/// Load one expense with its splits, joined with display names.
async fn load_expense(state: &AppState, expense_id: Uuid) -> AppResult<Expense> {
    let row: (
        Uuid,
        Uuid,
        String,
        i64,
        DateTime<Utc>,
        DateTime<Utc>,
        Uuid,
        String,
        Option<Uuid>,
        Option<String>,
    ) = sqlx::query_as(
        "SELECT e.id, e.group_id, e.description, e.amount_cents, e.happened_at, e.created_at,
                e.paid_by,
                CASE WHEN gp.kind = 'member' THEN COALESCE(u.display_name, gp.display_name) ELSE gp.display_name END,
                e.trip_id, t.name
         FROM expenses e
         INNER JOIN group_people gp ON gp.group_id = e.group_id AND gp.id = e.paid_by
         LEFT JOIN users u ON u.id = gp.user_id
         LEFT JOIN trips t ON t.id = e.trip_id
         WHERE e.id = $1",
    )
    .bind(expense_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("expense not found".into()))?;

    let split_rows: Vec<(Uuid, String, i64)> = sqlx::query_as(
        "SELECT es.user_id,
                CASE WHEN gp.kind = 'member' THEN COALESCE(u.display_name, gp.display_name) ELSE gp.display_name END,
                es.amount_cents
         FROM expense_splits es
         INNER JOIN group_people gp ON gp.group_id = es.group_id AND gp.id = es.user_id
         LEFT JOIN users u ON u.id = gp.user_id
         WHERE es.expense_id = $1",
    )
    .bind(expense_id)
    .fetch_all(&state.db)
    .await?;

    let splits = split_rows
        .into_iter()
        .map(|(user_id, display_name, amount_cents)| ExpenseSplit {
            user_id,
            display_name,
            amount_cents,
        })
        .collect();

    Ok(Expense {
        id: row.0,
        group_id: row.1,
        paid_by: row.6,
        paid_by_display_name: row.7,
        description: row.2,
        amount_cents: row.3,
        happened_at: row.4,
        created_at: row.5,
        trip_id: row.8,
        trip_name: row.9,
        splits,
    })
}

pub async fn get_expense(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, expense_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<Expense>> {
    ensure_member(&state, group_id, user.id).await?;
    let expense = load_expense(&state, expense_id).await?;
    if expense.group_id != group_id {
        return Err(AppError::NotFound("expense not found".into()));
    }
    Ok(Json(expense))
}

pub async fn create_expense(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreateExpenseRequest>,
) -> AppResult<Json<Expense>> {
    payload.validate()?;
    ensure_member(&state, group_id, user.id).await?;
    validate_splits(
        &state,
        group_id,
        payload.amount_cents,
        payload.paid_by,
        &payload.splits,
        &std::collections::HashSet::new(),
    )
    .await?;
    ensure_trip_in_group(&state, group_id, payload.trip_id).await?;

    let happened_at = payload.happened_at.unwrap_or_else(Utc::now);

    let mut tx = state.db.begin().await?;
    let exp_id: (Uuid,) = sqlx::query_as(
        "INSERT INTO expenses (group_id, paid_by, description, amount_cents, happened_at, created_by, trip_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id",
    )
    .bind(group_id)
    .bind(payload.paid_by)
    .bind(payload.description.trim())
    .bind(payload.amount_cents)
    .bind(happened_at)
    .bind(user.id)
    .bind(payload.trip_id)
    .fetch_one(&mut *tx)
    .await?;

    for s in &payload.splits {
        sqlx::query(
            "INSERT INTO expense_splits (expense_id, user_id, amount_cents, group_id)
             VALUES ($1, $2, $3, $4)",
        )
        .bind(exp_id.0)
        .bind(s.user_id)
        .bind(s.amount_cents)
        .bind(group_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(load_expense(&state, exp_id.0).await?))
}

pub async fn update_expense(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, expense_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateExpenseRequest>,
) -> AppResult<Json<Expense>> {
    payload.validate()?;
    ensure_member(&state, group_id, user.id).await?;
    // Make sure the expense actually belongs to this group.
    let existing: Option<(Uuid, Uuid)> =
        sqlx::query_as("SELECT group_id, paid_by FROM expenses WHERE id = $1")
            .bind(expense_id)
            .fetch_optional(&state.db)
            .await?;
    let existing = existing.ok_or_else(|| AppError::NotFound("expense not found".into()))?;
    if existing.0 != group_id {
        return Err(AppError::NotFound("expense not found".into()));
    }
    let mut allowed_inactive = std::collections::HashSet::from([existing.1]);
    let old_splits: Vec<(Uuid,)> =
        sqlx::query_as("SELECT user_id FROM expense_splits WHERE expense_id = $1")
            .bind(expense_id)
            .fetch_all(&state.db)
            .await?;
    allowed_inactive.extend(old_splits.into_iter().map(|(id,)| id));
    validate_splits(
        &state,
        group_id,
        payload.amount_cents,
        payload.paid_by,
        &payload.splits,
        &allowed_inactive,
    )
    .await?;
    ensure_trip_in_group(&state, group_id, payload.trip_id).await?;

    let happened_at = payload.happened_at.unwrap_or_else(Utc::now);

    let mut tx = state.db.begin().await?;
    let updated = sqlx::query(
        "UPDATE expenses
         SET paid_by = $2,
             description = $3,
             amount_cents = $4,
             happened_at = $5,
             trip_id = $7
         WHERE id = $1 AND group_id = $6",
    )
    .bind(expense_id)
    .bind(payload.paid_by)
    .bind(payload.description.trim())
    .bind(payload.amount_cents)
    .bind(happened_at)
    .bind(group_id)
    .bind(payload.trip_id)
    .execute(&mut *tx)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::NotFound("expense not found".into()));
    }

    sqlx::query("DELETE FROM expense_splits WHERE expense_id = $1")
        .bind(expense_id)
        .execute(&mut *tx)
        .await?;

    for s in &payload.splits {
        sqlx::query(
            "INSERT INTO expense_splits (expense_id, user_id, amount_cents, group_id)
             VALUES ($1, $2, $3, $4)",
        )
        .bind(expense_id)
        .bind(s.user_id)
        .bind(s.amount_cents)
        .bind(group_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(load_expense(&state, expense_id).await?))
}

pub async fn delete_expense(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, expense_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    ensure_member(&state, group_id, user.id).await?;

    // Any group member can delete expenses inside their group.
    let result = sqlx::query("DELETE FROM expenses WHERE id = $1 AND group_id = $2")
        .bind(expense_id)
        .bind(group_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("expense not found".into()));
    }

    Ok(Json(serde_json::json!({ "ok": true })))
}

// ---------- payments ----------

pub async fn list_payments(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Vec<Payment>>> {
    ensure_member(&state, group_id, user.id).await?;

    let rows: Vec<(
        Uuid,
        Uuid,
        Uuid,
        String,
        Uuid,
        String,
        i64,
        Option<String>,
        DateTime<Utc>,
        DateTime<Utc>,
    )> = sqlx::query_as(
        "SELECT p.id, p.group_id,
                p.from_user,
                CASE WHEN gpf.kind = 'member' THEN COALESCE(uf.display_name, gpf.display_name) ELSE gpf.display_name END,
                p.to_user,
                CASE WHEN gpt.kind = 'member' THEN COALESCE(ut.display_name, gpt.display_name) ELSE gpt.display_name END,
                p.amount_cents, p.note, p.happened_at, p.created_at
         FROM splitwise_payments p
         INNER JOIN group_people gpf ON gpf.group_id = p.group_id AND gpf.id = p.from_user
         INNER JOIN group_people gpt ON gpt.group_id = p.group_id AND gpt.id = p.to_user
         LEFT JOIN users uf ON uf.id = gpf.user_id
         LEFT JOIN users ut ON ut.id = gpt.user_id
         WHERE p.group_id = $1
         ORDER BY p.happened_at DESC, p.created_at DESC",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let out = rows
        .into_iter()
        .map(
            |(
                id,
                group_id,
                from_user_id,
                from_display_name,
                to_user_id,
                to_display_name,
                amount_cents,
                note,
                happened_at,
                created_at,
            )| Payment {
                id,
                group_id,
                from_user_id,
                from_display_name,
                to_user_id,
                to_display_name,
                amount_cents,
                note,
                happened_at,
                created_at,
            },
        )
        .collect();

    Ok(Json(out))
}

pub async fn create_payment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreatePaymentRequest>,
) -> AppResult<Json<Payment>> {
    payload.validate()?;
    ensure_member(&state, group_id, user.id).await?;

    if payload.from_user == payload.to_user {
        return Err(AppError::BadRequest(
            "from_user and to_user must differ".into(),
        ));
    }

    // Both parties must be people belonging to the group.
    let member_ids: Vec<(Uuid,)> =
        sqlx::query_as("SELECT id FROM group_people WHERE group_id = $1")
            .bind(group_id)
            .fetch_all(&state.db)
            .await?;
    let member_set: std::collections::HashSet<Uuid> =
        member_ids.into_iter().map(|(u,)| u).collect();
    if !member_set.contains(&payload.from_user) {
        return Err(AppError::BadRequest(
            "from_user is not a person in this group".into(),
        ));
    }
    if !member_set.contains(&payload.to_user) {
        return Err(AppError::BadRequest(
            "to_user is not a person in this group".into(),
        ));
    }

    let happened_at = payload.happened_at.unwrap_or_else(Utc::now);
    let note = payload
        .note
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_owned);

    let row: (Uuid,) = sqlx::query_as(
        "INSERT INTO splitwise_payments
            (group_id, from_user, to_user, amount_cents, note, happened_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id",
    )
    .bind(group_id)
    .bind(payload.from_user)
    .bind(payload.to_user)
    .bind(payload.amount_cents)
    .bind(note)
    .bind(happened_at)
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    load_payment(&state, row.0).await.map(Json)
}

pub async fn delete_payment(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, payment_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    ensure_member(&state, group_id, user.id).await?;

    let result = sqlx::query("DELETE FROM splitwise_payments WHERE id = $1 AND group_id = $2")
        .bind(payment_id)
        .bind(group_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("payment not found".into()));
    }

    Ok(Json(serde_json::json!({ "ok": true })))
}

async fn load_payment(state: &AppState, payment_id: Uuid) -> AppResult<Payment> {
    let row: (
        Uuid,
        Uuid,
        Uuid,
        String,
        Uuid,
        String,
        i64,
        Option<String>,
        DateTime<Utc>,
        DateTime<Utc>,
    ) = sqlx::query_as(
        "SELECT p.id, p.group_id,
                p.from_user,
                CASE WHEN gpf.kind = 'member' THEN COALESCE(uf.display_name, gpf.display_name) ELSE gpf.display_name END,
                p.to_user,
                CASE WHEN gpt.kind = 'member' THEN COALESCE(ut.display_name, gpt.display_name) ELSE gpt.display_name END,
                p.amount_cents, p.note, p.happened_at, p.created_at
         FROM splitwise_payments p
         INNER JOIN group_people gpf ON gpf.group_id = p.group_id AND gpf.id = p.from_user
         INNER JOIN group_people gpt ON gpt.group_id = p.group_id AND gpt.id = p.to_user
         LEFT JOIN users uf ON uf.id = gpf.user_id
         LEFT JOIN users ut ON ut.id = gpt.user_id
         WHERE p.id = $1",
    )
    .bind(payment_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("payment not found".into()))?;

    Ok(Payment {
        id: row.0,
        group_id: row.1,
        from_user_id: row.2,
        from_display_name: row.3,
        to_user_id: row.4,
        to_display_name: row.5,
        amount_cents: row.6,
        note: row.7,
        happened_at: row.8,
        created_at: row.9,
    })
}

#[cfg(test)]
mod tests {
    use super::{net_direct_debts, simplify_debts};
    use uuid::Uuid;

    #[test]
    fn guest_people_participate_in_simplified_settlements() {
        let member = Uuid::from_u128(1);
        let guest = Uuid::from_u128(2);
        let creditor = Uuid::from_u128(3);

        let settlements = simplify_debts(&[(member, -400), (guest, -600), (creditor, 1000)]);

        assert_eq!(settlements.len(), 2);
        assert!(settlements.contains(&(guest, creditor, 600)));
        assert!(settlements.contains(&(member, creditor, 400)));
    }

    #[test]
    fn guest_and_member_direct_debts_net_normally() {
        let member = Uuid::from_u128(1);
        let guest = Uuid::from_u128(2);

        let debts = net_direct_debts(&[(guest, member, 900), (member, guest, 250)]);

        assert_eq!(debts, vec![(guest, member, 650)]);
    }
}
