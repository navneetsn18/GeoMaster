CREATE TABLE guess_records (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    country_code VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_ms INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    guessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_guesses_session ON guess_records(session_id);
