ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Seed the original admin
UPDATE users SET role = 'ADMIN' WHERE email = 'navneetsn18@gmail.com';
