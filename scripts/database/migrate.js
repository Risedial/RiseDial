#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

class MigrationManager {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.migrationsDir = path.join(__dirname, '../../migrations');
  }

  async ensureMigrationsTable() {
    const { error } = await this.supabase.rpc('create_migrations_table');
    if (error && !error.message.includes('already exists')) {
      throw error;
    }
  }

  async getAppliedMigrations() {
    const { data, error } = await this.supabase
      .from('schema_migrations')
      .select('version')
      .order('version');

    if (error) throw error;
    return data.map(row => row.version);
  }

  async getPendingMigrations() {
    const files = await fs.readdir(this.migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    const appliedMigrations = await this.getAppliedMigrations();
    
    return migrationFiles.filter(file => {
      const version = file.split('_')[0];
      return !appliedMigrations.includes(version);
    });
  }

  async runMigration(filename) {
    const filePath = path.join(this.migrationsDir, filename);
    const sql = await fs.readFile(filePath, 'utf8');
    const version = filename.split('_')[0];

    console.log(`Running migration: ${filename}`);

    try {
      // Begin transaction
      const { error: sqlError } = await this.supabase.rpc('exec_sql', {
        sql_query: sql
      });

      if (sqlError) throw sqlError;

      // Record migration as applied
      const { error: recordError } = await this.supabase
        .from('schema_migrations')
        .insert({ version, applied_at: new Date().toISOString() });

      if (recordError) throw recordError;

      console.log(`✅ Migration ${filename} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error.message);
      throw error;
    }
  }

  async runPendingMigrations() {
    await this.ensureMigrationsTable();
    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }

    console.log('✅ All migrations completed successfully');
  }

  async rollbackMigration(steps = 1) {
    const appliedMigrations = await this.getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const migrationsToRollback = appliedMigrations
      .slice(-steps)
      .reverse();

    for (const version of migrationsToRollback) {
      const files = await fs.readdir(this.migrationsDir);
      const downFile = files.find(file => 
        file.startsWith(version) && file.includes('_down.sql')
      );

      if (!downFile) {
        console.warn(`No rollback file found for migration ${version}`);
        continue;
      }

      const filePath = path.join(this.migrationsDir, downFile);
      const sql = await fs.readFile(filePath, 'utf8');

      console.log(`Rolling back migration: ${version}`);

      try {
        const { error: sqlError } = await this.supabase.rpc('exec_sql', {
          sql_query: sql
        });

        if (sqlError) throw sqlError;

        // Remove migration record
        const { error: deleteError } = await this.supabase
          .from('schema_migrations')
          .delete()
          .eq('version', version);

        if (deleteError) throw deleteError;

        console.log(`✅ Rollback of ${version} completed successfully`);
      } catch (error) {
        console.error(`❌ Rollback of ${version} failed:`, error.message);
        throw error;
      }
    }
  }

  async createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}`;
    
    const upFile = path.join(this.migrationsDir, `${filename}_up.sql`);
    const downFile = path.join(this.migrationsDir, `${filename}_down.sql`);

    const upTemplate = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

BEGIN;

-- Add your migration SQL here

COMMIT;
`;

    const downTemplate = `-- Rollback: ${name}
-- Created: ${new Date().toISOString()}

BEGIN;

-- Add your rollback SQL here

COMMIT;
`;

    await fs.writeFile(upFile, upTemplate);
    await fs.writeFile(downFile, downTemplate);

    console.log(`✅ Created migration files:`);
    console.log(`  - ${upFile}`);
    console.log(`  - ${downFile}`);
  }

  async validateMigrations() {
    console.log('Validating migration files...');
    
    const files = await fs.readdir(this.migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));

    for (const file of sqlFiles) {
      const filePath = path.join(this.migrationsDir, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Basic SQL validation
      if (!content.trim()) {
        console.warn(`⚠️ Empty migration file: ${file}`);
        continue;
      }

      if (!content.includes('BEGIN') || !content.includes('COMMIT')) {
        console.warn(`⚠️ Migration ${file} should use transactions`);
      }

      console.log(`✅ Validated: ${file}`);
    }

    console.log('✅ Migration validation completed');
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const migrationManager = new MigrationManager();

  try {
    switch (command) {
      case 'migrate':
        await migrationManager.runPendingMigrations();
        break;
      
      case 'rollback':
        const steps = parseInt(process.argv[3]) || 1;
        await migrationManager.rollbackMigration(steps);
        break;
      
      case 'create':
        const name = process.argv[3];
        if (!name) {
          console.error('Please provide a migration name');
          process.exit(1);
        }
        await migrationManager.createMigration(name);
        break;
      
      case 'status':
        const pending = await migrationManager.getPendingMigrations();
        const applied = await migrationManager.getAppliedMigrations();
        
        console.log(`Applied migrations: ${applied.length}`);
        console.log(`Pending migrations: ${pending.length}`);
        
        if (pending.length > 0) {
          console.log('\nPending migrations:');
          pending.forEach(migration => console.log(`  - ${migration}`));
        }
        break;
      
      case 'validate':
        await migrationManager.validateMigrations();
        break;
      
      default:
        console.log(`
Usage: node migrate.js <command>

Commands:
  migrate         Run all pending migrations
  rollback [n]    Rollback last n migrations (default: 1)
  create <name>   Create a new migration
  status          Show migration status
  validate        Validate migration files

Environment variables required:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
        `);
        break;
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationManager; 