-- Idempotency receipts for conflict-free offline create operations. The
-- response body is retained so a retry after a lost connection receives the
-- exact same result instead of creating a duplicate row.
CREATE TABLE offline_operation_receipts (
    operation_id UUID PRIMARY KEY,
    request_hash TEXT NOT NULL,
    response_status SMALLINT,
    response_content_type TEXT,
    response_body BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offline_operation_receipts_created
    ON offline_operation_receipts(created_at);

