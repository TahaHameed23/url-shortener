select * from links;

-- Active refresh sessions for a user.
SELECT token_hash, user_id, expires_at
FROM refresh_tokens
WHERE user_id = ? AND revoked_at IS NULL AND expires_at > datetime('now');

-- Revoke a refresh session during logout or rotation.
UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token_hash = ?;

-- Apply once to existing D1 databases before enabling refresh-token auth.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens(expires_at);