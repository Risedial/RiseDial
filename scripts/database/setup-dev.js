#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDevDatabase() {
  console.log('Setting up development database...');
  
  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    // Ensure tables exist
    await ensureTablesExist();
    
    // Create sample data for development
    await createSampleData();
    
    console.log('✅ Development database setup completed successfully');
  } catch (error) {
    console.error('❌ Development database setup failed:', error.message);
    process.exit(1);
  }
}

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function ensureTablesExist() {
  console.log('Checking if required tables exist...');
  
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  const requiredTables = ['users', 'conversations', 'crisis_events'];
  const existingTables = tables?.map(t => t.table_name) || [];
  
  for (const table of requiredTables) {
    if (!existingTables.includes(table)) {
      console.warn(`⚠️ Table ${table} not found - please run migrations`);
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }
}

async function createSampleData() {
  console.log('Creating sample development data...');
  
  // Check if sample data already exists
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .like('id', 'dev-%')
    .limit(1);
  
  if (existingUsers && existingUsers.length > 0) {
    console.log('Sample data already exists, skipping creation');
    return;
  }
  
  // Create sample user
  const sampleUser = {
    id: 'dev-user-1',
    telegram_id: 123456789,
    first_name: 'Dev User',
    subscription_tier: 'premium',
    created_at: new Date().toISOString()
  };
  
  const { error: userError } = await supabase
    .from('users')
    .insert(sampleUser);
  
  if (userError) {
    console.error('Failed to create sample user:', userError);
  } else {
    console.log('✅ Sample user created');
  }
}

if (require.main === module) {
  setupDevDatabase();
}

module.exports = { setupDevDatabase, testConnection }; 