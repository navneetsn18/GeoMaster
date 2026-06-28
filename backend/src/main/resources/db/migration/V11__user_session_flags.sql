CREATE TABLE user_session_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(36) NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, user_id)
);

CREATE INDEX idx_usf_session ON user_session_flags(session_id);
