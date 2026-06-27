CREATE TABLE game_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    map_type VARCHAR(20) NOT NULL,
    region_code VARCHAR(10),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    total_score INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_sessions_map_type ON game_sessions(map_type);
CREATE INDEX idx_sessions_completed ON game_sessions(completed_at);
