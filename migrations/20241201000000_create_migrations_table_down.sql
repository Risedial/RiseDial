-- Rollback: Create migrations table
-- Created: 2024-12-01T00:00:00.000Z

BEGIN;

-- Drop the functions
DROP FUNCTION IF EXISTS create_migrations_table();
DROP FUNCTION IF EXISTS exec_sql(TEXT);

-- Drop the migrations table
DROP TABLE IF EXISTS schema_migrations;

COMMIT; 