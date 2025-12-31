-- Initialize Green Pages Database
-- This script runs on first container start

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create full text search configuration for Arabic
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'arabic') THEN
        CREATE TEXT SEARCH CONFIGURATION arabic (COPY = simple);
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE greenpages TO greenpages;
