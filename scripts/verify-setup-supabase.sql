-- =====================================================
-- SUPABASE SETUP VERIFICATION SCRIPT (Web Interface)
-- =====================================================
-- This script checks all critical setup items from the security checklist
-- Compatible with Supabase SQL Editor web interface

SELECT '🔍 Starting Supabase Setup Verification...' as message;

-- =====================================================
-- 1. CHECK RLS (Row Level Security) STATUS
-- =====================================================
SELECT '1️⃣ Checking Row Level Security (RLS) status...' as section;

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

-- =====================================================
-- 2. CHECK RLS POLICIES EXIST
-- =====================================================
SELECT '2️⃣ Checking RLS Policies...' as section;

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

-- =====================================================
-- 3. CHECK DATABASE SCHEMA COMPLETENESS
-- =====================================================
SELECT '3️⃣ Checking Database Schema Completeness...' as section;

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

-- =====================================================
-- 4. CHECK REQUIRED EXTENSIONS
-- =====================================================
SELECT '4️⃣ Checking Required Extensions...' as section;

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
    'uuid-ossp' as "Extension Name",
    '❌ Missing' as status
WHERE NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')
UNION ALL
SELECT 
    'vector' as "Extension Name",
    '❌ Missing' as status
WHERE NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
ORDER BY "Extension Name";

-- =====================================================
-- 5. CHECK INDEXES EXIST
-- =====================================================
SELECT '5️⃣ Checking Critical Indexes...' as section;

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

-- =====================================================
-- 6. CHECK CRISIS DETECTION TRIGGERS
-- =====================================================
SELECT '6️⃣ Checking Crisis Detection Triggers...' as section;

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

-- =====================================================
-- 7. CHECK DATABASE FUNCTIONS
-- =====================================================
SELECT '7️⃣ Checking Database Functions...' as section;

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

-- =====================================================
-- 8. CHECK SYSTEM CONFIGURATION
-- =====================================================
SELECT '8️⃣ Checking System Configuration...' as section;

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

-- =====================================================
-- 9. CHECK FOR SENSITIVE DATA IN PUBLIC SCHEMA
-- =====================================================
SELECT '9️⃣ Checking for Potential Sensitive Data Exposure...' as section;

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

-- =====================================================
-- 10. CHECK API USAGE MONITORING
-- =====================================================
SELECT '10. Checking API Usage Monitoring...' as section;

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

-- =====================================================
-- 11. CHECK DATABASE PERFORMANCE METRICS
-- =====================================================
SELECT '1️⃣1️⃣ Checking Database Performance Metrics...' as section;

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 12. SECURITY SUMMARY
-- =====================================================
SELECT '📋 SECURITY CHECKLIST SUMMARY' as section;
SELECT '================================' as separator;

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

SELECT '🎉 Setup verification complete!' as completion_message;

SELECT '📝 Manual checks still required:' as manual_checks;
SELECT '• Service role key not in client-side code' as check_1;
SELECT '• Webhook endpoints have authentication' as check_2;
SELECT '• Environment variables properly secured' as check_3;
SELECT '• Database backups enabled in Supabase dashboard' as check_4; 