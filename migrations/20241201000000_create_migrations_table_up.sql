-- Migration: Create migrations table
-- Created: 2024-12-01T00:00:00.000Z

BEGIN;

-- Create schema_migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to execute SQL (used by migration manager)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;

-- Create function to create migrations table (used by migration manager)
CREATE OR REPLACE FUNCTION create_migrations_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
END;
$$ LANGUAGE plpgsql;

COMMIT; 