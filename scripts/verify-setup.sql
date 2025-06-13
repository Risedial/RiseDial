-- =====================================================
-- SUPABASE SETUP VERIFICATION SCRIPT
-- =====================================================
-- This script checks all critical setup items from the security checklist

\echo '🔍 Starting Supabase Setup Verification...'
\echo ''

-- =====================================================
-- 1. CHECK RLS (Row Level Security) STATUS
-- =====================================================
\echo '1️⃣ Checking Row Level Security (RLS) status...'

SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'users', 
        'user_psychological_profiles', 
        'conversations', 
        'progress_metrics', 
        'crisis_events', 
        'active_sessions', 
        'api_usage', 
        'user_feedback',
        'system_config'
    )
ORDER BY tablename;

\echo ''

-- =====================================================
-- 2. CHECK RLS POLICIES EXIST
-- =====================================================
\echo '2️⃣ Checking RLS Policies...'

SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd as "Command Type",
    qual as "Policy Condition"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''

-- =====================================================
-- 3. CHECK DATABASE SCHEMA COMPLETENESS
-- =====================================================
\echo '3️⃣ Checking Database Schema Completeness...'

WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'users', 
        'user_psychological_profiles', 
        'conversations', 
        'progress_metrics', 
        'crisis_events', 
        'active_sessions', 
        'api_usage', 
        'user_feedback',
        'system_config'
    ]) as table_name
),
existing_tables AS (
    SELECT tablename as table_name
    FROM pg_tables 
    WHERE schemaname = 'public'
)
SELECT 
    et.table_name,
    CASE 
        WHEN ext.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM expected_tables et
LEFT JOIN existing_tables ext ON et.table_name = ext.table_name
ORDER BY et.table_name;

\echo ''

-- =====================================================
-- 4. CHECK REQUIRED EXTENSIONS
-- =====================================================
\echo '4️⃣ Checking Required Extensions...'

SELECT 
    extname as "Extension Name",
    CASE 
        WHEN extname IS NOT NULL THEN '✅ Installed'
        ELSE '❌ Missing'
    END as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector')
UNION ALL
SELECT 
    'uuid-ossp' as extname,
    '❌ Missing' as status
WHERE NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')
UNION ALL
SELECT 
    'vector' as extname,
    '❌ Missing' as status
WHERE NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
ORDER BY extname;

\echo ''

-- =====================================================
-- 5. CHECK INDEXES EXIST
-- =====================================================
\echo '5️⃣ Checking Critical Indexes...'

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef as "Index Definition"
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN (
        'conversations', 
        'crisis_events', 
        'progress_metrics', 
        'api_usage', 
        'user_feedback'
    )
ORDER BY tablename, indexname;

\echo ''

-- =====================================================
-- 6. CHECK CRISIS DETECTION TRIGGERS
-- =====================================================
\echo '6️⃣ Checking Crisis Detection Triggers...'

SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ Active'
        ELSE '❌ Missing'
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND (
        trigger_name LIKE '%crisis%' 
        OR event_object_table = 'crisis_events'
        OR trigger_name LIKE '%user_activity%'
    )
ORDER BY event_object_table, trigger_name;

\echo ''

-- =====================================================
-- 7. CHECK DATABASE FUNCTIONS
-- =====================================================
\echo '7️⃣ Checking Database Functions...'

SELECT 
    routine_schema,
    routine_name,
    routine_type,
    data_type as return_type,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN (
        'update_user_activity',
        'clean_expired_sessions',
        'get_daily_cost',
        'notify_crisis_webhook'
    )
ORDER BY routine_name;

\echo ''

-- =====================================================
-- 8. CHECK SYSTEM CONFIGURATION
-- =====================================================
\echo '8️⃣ Checking System Configuration...'

SELECT 
    key,
    environment,
    is_active,
    description,
    CASE 
        WHEN is_active THEN '✅ Active'
        ELSE '⚠️  Inactive'
    END as status
FROM system_config 
ORDER BY key;

\echo ''

-- =====================================================
-- 9. CHECK FOR SENSITIVE DATA IN PUBLIC SCHEMA
-- =====================================================
\echo '9️⃣ Checking for Potential Sensitive Data Exposure...'

-- Check if any tables have obvious sensitive column names
SELECT 
    table_name,
    column_name,
    data_type,
    '⚠️  Review Required' as status
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND (
        column_name ILIKE '%password%'
        OR column_name ILIKE '%secret%'
        OR column_name ILIKE '%token%'
        OR column_name ILIKE '%key%'
        OR column_name ILIKE '%private%'
    )
    AND column_name NOT IN ('crisis_risk_level', 'service_role_key', 'anon_key')
ORDER BY table_name, column_name;

\echo ''

-- =====================================================
-- 10. CHECK API USAGE MONITORING
-- =====================================================
\echo '🔟 Checking API Usage Monitoring...'

-- Check if api_usage table has recent data
SELECT 
    'API Usage Tracking' as component,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_records,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Active'
        ELSE '⚠️  No Data'
    END as status
FROM api_usage;

\echo ''

-- =====================================================
-- 11. CHECK DATABASE PERFORMANCE METRICS
-- =====================================================
\echo '1️⃣1️⃣ Checking Database Performance Metrics...'

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''

-- =====================================================
-- 12. SECURITY SUMMARY
-- =====================================================
\echo '📋 SECURITY CHECKLIST SUMMARY'
\echo '================================'

WITH security_check AS (
    SELECT 
        'RLS Enabled' as check_item,
        CASE 
            WHEN COUNT(*) = COUNT(CASE WHEN rowsecurity THEN 1 END) THEN '✅ PASS'
            ELSE '❌ FAIL'
        END as status
    FROM pg_tables 
    WHERE schemaname = 'public' 
        AND tablename IN ('users', 'conversations', 'crisis_events', 'system_config')
    
    UNION ALL
    
    SELECT 
        'RLS Policies Configured' as check_item,
        CASE 
            WHEN COUNT(*) > 0 THEN '✅ PASS'
            ELSE '❌ FAIL'
        END as status
    FROM pg_policies 
    WHERE schemaname = 'public'
    
    UNION ALL
    
    SELECT 
        'Crisis Detection Active' as check_item,
        CASE 
            WHEN COUNT(*) > 0 THEN '✅ PASS'
            ELSE '❌ FAIL'
        END as status
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
        AND (trigger_name LIKE '%crisis%' OR event_object_table = 'crisis_events')
    
    UNION ALL
    
    SELECT 
        'System Config Present' as check_item,
        CASE 
            WHEN COUNT(*) > 0 THEN '✅ PASS'
            ELSE '❌ FAIL'
        END as status
    FROM system_config
    
    UNION ALL
    
    SELECT 
        'Required Extensions' as check_item,
        CASE 
            WHEN COUNT(*) >= 2 THEN '✅ PASS'
            ELSE '❌ FAIL'
        END as status
    FROM pg_extension 
    WHERE extname IN ('uuid-ossp', 'vector')
)
SELECT * FROM security_check;

\echo ''
\echo '🎉 Setup verification complete!'
\echo ''
\echo '📝 Manual checks still required:'
\echo '   • Service role key not in client-side code'
\echo '   • Webhook endpoints have authentication'
\echo '   • Environment variables properly secured'
\echo '   • Database backups enabled in Supabase dashboard' 