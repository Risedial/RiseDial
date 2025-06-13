# Supabase Setup Guide for Risedial

## Prerequisites
- Supabase account (free tier sufficient for development)
- Git repository access
- Node.js 18+ installed locally

## Step 1: Create Supabase Project

1. **Create Project**
   ```bash
   # Go to https://supabase.com/dashboard
   # Click "New Project"
   # Project Name: risedial-[environment] (dev/staging/prod)
   # Database Password: Generate strong password
   # Region: Choose closest to your users
   ```

2. **Get Project Credentials**
   ```bash
   # Navigate to Settings > API
   # Copy these values:
   PROJECT_URL=https://[project-id].supabase.co
   ANON_KEY=eyJ[...] (anon/public key)
   SERVICE_ROLE_KEY=eyJ[...] (service_role key - keep secret!)
   ```

## Step 2: Database Schema Setup

1. **Run Database Migrations**
   ```sql
   -- Go to SQL Editor in Supabase Dashboard
   -- Run these commands in order:

   -- Enable required extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "vector";

   -- Users table
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       telegram_id BIGINT UNIQUE NOT NULL,
       username TEXT,
       first_name TEXT,
       subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'unlimited')),
       daily_message_count INTEGER DEFAULT 0,
       last_message_date DATE DEFAULT CURRENT_DATE,
       total_messages INTEGER DEFAULT 0,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Psychological profiles table
   CREATE TABLE user_psychological_profiles (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       
       -- Core personality patterns
       core_beliefs JSONB DEFAULT '{}',
       limiting_beliefs JSONB DEFAULT '[]',
       empowering_beliefs JSONB DEFAULT '[]',
       resistance_patterns JSONB DEFAULT '{}',
       communication_style JSONB DEFAULT '{}',
       
       -- Current emotional state
       emotional_state TEXT DEFAULT 'neutral',
       stress_level INTEGER DEFAULT 5 CHECK (stress_level >= 1 AND stress_level <= 10),
       openness_level INTEGER DEFAULT 5 CHECK (openness_level >= 1 AND openness_level <= 10),
       readiness_for_change INTEGER DEFAULT 5 CHECK (readiness_for_change >= 1 AND readiness_for_change <= 10),
       energy_level INTEGER DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10),
       
       -- Progress tracking
       identity_evolution JSONB DEFAULT '[]',
       behavioral_changes JSONB DEFAULT '[]',
       goal_progression JSONB DEFAULT '{}',
       breakthrough_moments JSONB DEFAULT '[]',
       values_clarity JSONB DEFAULT '{}',
       
       -- Therapeutic effectiveness
       technique_effectiveness JSONB DEFAULT '{}',
       successful_interventions JSONB DEFAULT '[]',
       resistance_triggers JSONB DEFAULT '[]',
       preferred_approaches JSONB DEFAULT '[]',
       
       -- Risk assessment
       crisis_risk_level INTEGER DEFAULT 0 CHECK (crisis_risk_level >= 0 AND crisis_risk_level <= 10),
       support_system_strength INTEGER DEFAULT 5 CHECK (support_system_strength >= 1 AND support_system_strength <= 10),
       
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       
       UNIQUE(user_id)
   );

   -- Conversations table with vector search
   CREATE TABLE conversations (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       message_text TEXT NOT NULL,
       message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
       
       -- Message analysis
       emotional_tone TEXT,
       confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
       crisis_risk_level INTEGER DEFAULT 0 CHECK (crisis_risk_level >= 0 AND crisis_risk_level <= 10),
       therapeutic_value INTEGER DEFAULT 5 CHECK (therapeutic_value >= 1 AND therapeutic_value <= 10),
       
       -- Context and insights
       conversation_summary TEXT,
       key_insights JSONB DEFAULT '[]',
       agent_analysis JSONB DEFAULT '{}',
       therapeutic_techniques_used JSONB DEFAULT '[]',
       
       -- Token usage tracking
       tokens_used INTEGER DEFAULT 0,
       cost_usd DECIMAL(10,6) DEFAULT 0,
       
       -- Vector embeddings for semantic search
       embedding vector(1536),
       
       -- Conversation metadata
       session_id UUID,
       conversation_turn INTEGER DEFAULT 1,
       response_time_ms INTEGER,
       
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes for conversations table
   CREATE INDEX idx_conversations_user_created ON conversations (user_id, created_at);
   CREATE INDEX idx_conversations_crisis_risk ON conversations (crisis_risk_level) WHERE crisis_risk_level > 0;

   -- Progress metrics tracking
   CREATE TABLE progress_metrics (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       
       metric_type TEXT NOT NULL, -- 'identity', 'behavior', 'emotion', 'goal', 'relationship'
       metric_name TEXT NOT NULL,
       metric_value DECIMAL(10,4),
       metric_category TEXT,
       
       baseline_value DECIMAL(10,4),
       trend_direction TEXT CHECK (trend_direction IN ('improving', 'declining', 'stable', 'unknown')),
       confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
       
       measurement_method TEXT, -- 'language_analysis', 'self_report', 'behavioral_indicator'
       data_source JSONB DEFAULT '{}',
       
       measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes for progress_metrics table
   CREATE INDEX idx_progress_metrics_user_type ON progress_metrics (user_id, metric_type, measured_at);

   -- Crisis events and safety tracking
   CREATE TABLE crisis_events (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       
       severity_level INTEGER NOT NULL CHECK (severity_level >= 1 AND severity_level <= 10),
       crisis_type TEXT, -- 'suicide', 'self_harm', 'abuse', 'medical', 'substance'
       trigger_keywords TEXT[],
       context_summary TEXT,
       
       -- Response details
       response_given TEXT,
       resources_provided JSONB DEFAULT '[]',
       human_notified BOOLEAN DEFAULT FALSE,
       follow_up_required BOOLEAN DEFAULT TRUE,
       
       -- Resolution tracking
       resolved BOOLEAN DEFAULT FALSE,
       resolution_notes TEXT,
       resolved_at TIMESTAMP WITH TIME ZONE,
       
       -- Escalation tracking
       escalated_to TEXT, -- 'human_moderator', 'crisis_specialist', 'emergency_services'
       escalation_time TIMESTAMP WITH TIME ZONE,
       
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes for crisis_events table
   CREATE INDEX idx_crisis_events_severity ON crisis_events (severity_level, created_at);
   CREATE INDEX idx_crisis_events_unresolved ON crisis_events (resolved, follow_up_required) WHERE NOT resolved;

   -- Active sessions for context compression
   CREATE TABLE active_sessions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       
       compressed_context JSONB,
       context_version INTEGER DEFAULT 1,
       messages_since_compression INTEGER DEFAULT 0,
       
       last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours'),
       
       UNIQUE(user_id)
   );

   -- API usage and cost tracking
   CREATE TABLE api_usage (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       
       api_provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
       model_used TEXT NOT NULL,
       
       tokens_input INTEGER DEFAULT 0,
       tokens_output INTEGER DEFAULT 0,
       tokens_total INTEGER DEFAULT 0,
       
       cost_usd DECIMAL(10,6) DEFAULT 0,
       
       request_type TEXT, -- 'conversation', 'analysis', 'embedding', 'compression'
       response_time_ms INTEGER,
       
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes for api_usage table
   CREATE INDEX idx_api_usage_user_date ON api_usage (user_id, created_at);
   CREATE INDEX idx_api_usage_costs ON api_usage (cost_usd, created_at);

   -- System configuration and feature flags
   CREATE TABLE system_config (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       key TEXT UNIQUE NOT NULL,
       value JSONB NOT NULL,
       description TEXT,
       environment TEXT DEFAULT 'all', -- 'dev', 'staging', 'prod', 'all'
       is_active BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- User feedback and ratings
   CREATE TABLE user_feedback (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       
       rating INTEGER CHECK (rating >= 1 AND rating <= 10),
       feedback_text TEXT,
       feedback_type TEXT, -- 'conversation_rating', 'feature_request', 'bug_report', 'general'
       
       conversation_id UUID REFERENCES conversations(id),
       specific_feature TEXT,
       
       sentiment TEXT, -- 'positive', 'negative', 'neutral'
       priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
       
       admin_response TEXT,
       status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
       
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes for user_feedback table
   CREATE INDEX idx_user_feedback_rating ON user_feedback (rating, created_at);
   CREATE INDEX idx_user_feedback_status ON user_feedback (status, priority);
   ```

2. **Create Database Functions**
   ```sql
   -- Function to update user activity
   CREATE OR REPLACE FUNCTION update_user_activity()
   RETURNS TRIGGER AS $$
   BEGIN
       UPDATE users 
       SET updated_at = NOW(),
           total_messages = total_messages + 1
       WHERE id = NEW.user_id;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Trigger to automatically update user activity
   CREATE TRIGGER trigger_update_user_activity
       AFTER INSERT ON conversations
       FOR EACH ROW EXECUTE FUNCTION update_user_activity();

   -- Function to clean expired sessions
   CREATE OR REPLACE FUNCTION clean_expired_sessions()
   RETURNS INTEGER AS $$
   DECLARE
       deleted_count INTEGER;
   BEGIN
       DELETE FROM active_sessions WHERE expires_at < NOW();
       GET DIAGNOSTICS deleted_count = ROW_COUNT;
       RETURN deleted_count;
   END;
   $$ LANGUAGE plpgsql;

   -- Function to calculate daily costs per user
   CREATE OR REPLACE FUNCTION get_daily_cost(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
   RETURNS DECIMAL AS $$
   BEGIN
       RETURN (
           SELECT COALESCE(SUM(cost_usd), 0)
           FROM api_usage
           WHERE user_id = user_uuid
           AND DATE(created_at) = target_date
       );
   END;
   $$ LANGUAGE plpgsql;
   ```

## Step 3: Row Level Security (RLS) Setup

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_psychological_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Service role can access everything (for backend operations)
CREATE POLICY "Service role full access" ON users
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON user_psychological_profiles
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON conversations
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON progress_metrics
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON crisis_events
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON active_sessions
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON api_usage
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON user_feedback
FOR ALL USING (auth.role() = 'service_role');

-- System config accessible by service role only
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON system_config
FOR ALL USING (auth.role() = 'service_role');
```

## Step 4: Initial Configuration Data

```sql
-- Insert initial system configuration
INSERT INTO system_config (key, value, description) VALUES
('message_limits', '{"basic": 15, "premium": 50, "unlimited": 1000}', 'Daily message limits per subscription tier'),
('cost_limits', '{"daily_user_limit": 0.50, "monthly_user_limit": 15.00}', 'Cost limits in USD'),
('crisis_keywords', '["kill myself", "suicide", "end my life", "hurt myself", "self harm", "not worth living", "better off dead", "end it all"]', 'Emergency crisis detection keywords'),
('concern_keywords', '["hopeless", "no point", "give up", "cant go on", "burden", "escape", "end the pain", "nothing matters"]', 'Concern-level crisis keywords'),
('therapeutic_techniques', '["CBT", "NLP", "Narrative Therapy", "ACT", "Motivational Interviewing"]', 'Available therapeutic approaches'),
('crisis_resources', '{"suicide_prevention": "988", "crisis_text": "741741", "emergency": "911"}', 'Crisis support resources'),
('openai_models', '{"primary": "gpt-4", "backup": "gpt-3.5-turbo", "embedding": "text-embedding-ada-002"}', 'OpenAI model configuration');
```

## Step 5: Environment Configuration

1. **Create Environment File**
   ```bash
   # Create .env.local in your project root
   SUPABASE_URL=https://[your-project-id].supabase.co
   SUPABASE_ANON_KEY=eyJ[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=eyJ[your-service-role-key]
   
   # Add to your Vercel environment variables
   ```

2. **Verify Connection**
   ```typescript
   // test-connection.ts
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );
   
   async function testConnection() {
     const { data, error } = await supabase
       .from('users')
       .select('count')
       .limit(1);
     
     if (error) {
       console.error('Connection failed:', error);
     } else {
       console.log('✅ Supabase connected successfully');
     }
   }
   
   testConnection();
   ```

## Step 6: Backup and Monitoring Setup

1. **Enable Point-in-Time Recovery**
   ```bash
   # In Supabase Dashboard:
   # Settings > Database > Point-in-time Recovery
   # Enable PITR (automatic backups)
   ```

2. **Set Up Database Webhooks**
   ```sql
   -- Create webhook for crisis events
   CREATE OR REPLACE FUNCTION notify_crisis_webhook()
   RETURNS TRIGGER AS $$
   BEGIN
     PERFORM net.http_post(
       url := 'https://your-app.vercel.app/api/webhooks/crisis',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := json_build_object(
         'user_id', NEW.user_id,
         'severity', NEW.severity_level,
         'created_at', NEW.created_at
       )::text
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE TRIGGER crisis_webhook_trigger
     AFTER INSERT ON crisis_events
     FOR EACH ROW
     WHEN (NEW.severity_level >= 8)
     EXECUTE FUNCTION notify_crisis_webhook();
   ```

## Troubleshooting

**Common Issues:**
- **Vector extension not found**: Ensure you're on Supabase Pro plan or higher
- **RLS blocking queries**: Check your policies and use service role key for backend
- **Migration failures**: Run commands one at a time, check for syntax errors
- **Connection timeouts**: Verify environment variables and network connectivity

**Performance Optimization:**
- **Indexes**: All critical indexes are included in schema
- **Partitioning**: Consider partitioning conversations table if >1M rows
- **Connection pooling**: Use Supabase's built-in connection pooling
- **Query optimization**: Use EXPLAIN ANALYZE for slow queries

## Security Checklist
- [ ] RLS enabled on all tables
- [ ] Service role key secured and not in client code
- [ ] Database backups enabled
- [ ] Webhook endpoints secured with authentication
- [ ] No sensitive data in public schema
- [ ] Crisis detection triggers functional
- [ ] API usage monitoring active 