#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  try {
    // Clean existing test data
    await cleanTestData();
    
    // Create test tables if they don't exist
    await createTestTables();
    
    // Insert test data
    await insertTestData();
    
    console.log('✅ Test database setup completed successfully');
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message);
    process.exit(1);
  }
}

async function cleanTestData() {
  console.log('Cleaning existing test data...');
  
  // Delete test data (where IDs start with 'test-')
  await supabase.from('conversations').delete().like('user_id', 'test-%');
  await supabase.from('crisis_events').delete().like('user_id', 'test-%');
  await supabase.from('users').delete().like('id', 'test-%');
  
  console.log('Test data cleaned');
}

async function createTestTables() {
  console.log('Ensuring test tables exist...');
  
  // Tables should already exist from migrations
  // This is just a verification step
  
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  const requiredTables = ['users', 'conversations', 'crisis_events'];
  const existingTables = tables?.map(t => t.table_name) || [];
  
  for (const table of requiredTables) {
    if (!existingTables.includes(table)) {
      console.warn(`⚠️ Table ${table} not found`);
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }
}

async function insertTestData() {
  console.log('Inserting test data...');
  
  // Create test user
  const testUser = {
    id: 'test-user-1',
    telegram_id: 999999,
    first_name: 'Test User',
    subscription_tier: 'basic',
    created_at: new Date().toISOString()
  };
  
  const { error: userError } = await supabase
    .from('users')
    .insert(testUser);
  
  if (userError) {
    console.error('Failed to insert test user:', userError);
  } else {
    console.log('✅ Test user created');
  }
}

// Database connection test
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

if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase, testConnection }; 