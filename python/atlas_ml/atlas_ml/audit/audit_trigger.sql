-- Atlas audit ledger: tamper-evident hash chain as a Postgres trigger.
-- Production target for atlas_ml/audit/ledger.py (same sha256(prev_hash || body)
-- scheme). No blockchain (coordination doc §1 rule 7).

CREATE TABLE IF NOT EXISTS audit_records (
    seq          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor        TEXT  NOT NULL,
    action       TEXT  NOT NULL,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash    TEXT  NOT NULL,
    hash         TEXT  NOT NULL
);

CREATE OR REPLACE FUNCTION audit_hash_chain() RETURNS TRIGGER AS $$
DECLARE
    last_hash TEXT;
    body      TEXT;
BEGIN
    SELECT hash INTO last_hash FROM audit_records ORDER BY seq DESC LIMIT 1;
    IF last_hash IS NULL THEN
        last_hash := repeat('0', 64);  -- genesis
    END IF;

    NEW.prev_hash := last_hash;
    -- canonical body: keep field order/format aligned with the Python ledger
    body := json_build_object(
        'seq', NEW.seq, 'recorded_at', to_char(NEW.recorded_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"+00:00"'),
        'actor', NEW.actor, 'action', NEW.action, 'payload', NEW.payload
    )::text;
    NEW.hash := encode(digest(last_hash || body, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- requires pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TRIGGER IF EXISTS trg_audit_hash_chain ON audit_records;
CREATE TRIGGER trg_audit_hash_chain
    BEFORE INSERT ON audit_records
    FOR EACH ROW EXECUTE FUNCTION audit_hash_chain();

-- Block mutation of the append-only ledger.
CREATE OR REPLACE FUNCTION audit_no_mutate() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_records is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_no_update ON audit_records;
CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE OR DELETE ON audit_records
    FOR EACH ROW EXECUTE FUNCTION audit_no_mutate();

-- Chain verifier as a set-returning function (mirrors jobs/verify_chain.py).
CREATE OR REPLACE FUNCTION verify_audit_chain()
RETURNS TABLE(seq BIGINT, error TEXT) AS $$
DECLARE
    r          RECORD;
    expected   TEXT := repeat('0', 64);
    body       TEXT;
    recomputed TEXT;
BEGIN
    FOR r IN SELECT * FROM audit_records ORDER BY seq LOOP
        body := json_build_object(
            'seq', r.seq, 'recorded_at', to_char(r.recorded_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"+00:00"'),
            'actor', r.actor, 'action', r.action, 'payload', r.payload
        )::text;
        recomputed := encode(digest(r.prev_hash || body, 'sha256'), 'hex');
        IF r.prev_hash <> expected THEN
            seq := r.seq; error := 'broken_link'; RETURN NEXT;
        END IF;
        IF recomputed <> r.hash THEN
            seq := r.seq; error := 'tampered'; RETURN NEXT;
        END IF;
        expected := r.hash;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
