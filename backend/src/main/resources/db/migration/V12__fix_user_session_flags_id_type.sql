-- Fix: V11 created id as native UUID type; all other tables use VARCHAR(36).
-- Hibernate GenerationType.UUID maps to varchar, so schema-validation fails.
ALTER TABLE user_session_flags
    ALTER COLUMN id TYPE VARCHAR(36) USING id::text;
