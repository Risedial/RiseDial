# Database Types & Utilities

## Overview

This module provides comprehensive TypeScript types and database utilities for Risedial's therapeutic AI system, built on Supabase PostgreSQL.

## Architecture

```
src/types/
├── database.ts    # Core Supabase schema types
├── user.ts        # User business logic types  
├── conversation.ts # AI conversation types
├── crisis.ts      # Crisis detection types
└── index.ts       # Unified exports

src/lib/
├── database.ts    # Supabase client & utilities
├── config.ts      # Environment configuration
└── index.ts       # Library exports
```

## Database Schema

### Core Tables

1. **users** - User accounts and subscription tiers
2. **user_psychological_profiles** - Therapeutic progress tracking
3. **conversations** - Message history with AI analysis
4. **progress_metrics** - Hidden progress tracking
5. **crisis_events** - Safety incident management
6. **active_sessions** - Context compression system
7. **api_usage** - Cost tracking and monitoring
8. **system_config** - Feature flags and settings
9. **user_feedback** - User satisfaction tracking

### Key Features

- **Perfect Multi-tenancy**: Row Level Security with user isolation
- **Vector Search**: Conversation embeddings for semantic search
- **Cost Tracking**: Per-user API usage monitoring
- **Crisis Detection**: Automated safety intervention system
- **Progress Metrics**: Hidden therapeutic progress tracking

## Type System

### Database Types

```typescript
// Direct database row types
export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbUserInsert = Database['public']['Tables']['users']['Insert'];
export type DbUserUpdate = Database['public']['Tables']['users']['Update'];

// Extended business logic types
export interface User extends DbUser {
  psychological_profile?: PsychologicalProfile;
  subscription_status?: 'active' | 'expired' | 'trial';
  usage_stats?: UsageStats;
}
```

### Conversation Types

```typescript
export interface AIResponse {
  companion_response: string;
  emotional_tone: string;
  confidence_level: number;
  therapeutic_techniques: string[];
  crisis_risk_level: number;
  therapeutic_value: number;
  key_insights: string[];
  agent_analysis: AgentAnalysis;
  response_metadata: ResponseMetadata;
}
```

### Crisis Types

```typescript
export interface CrisisDetectionResult {
  riskLevel: number; // 0-10 scale
  requiresIntervention: boolean;
  detectedKeywords: string[];
  contextualFactors: string[];
  confidence: number;
  immediateActions: string[];
  escalationRequired: boolean;
  assessmentDetails: RiskAssessment;
}
```

## Database Utilities

### Core Operations

```typescript
import { db } from '@/lib/database';

// User management
const user = await db.getUserByTelegramId(telegramId);
const newUser = await db.createUser(userData);

// Conversation tracking
const conversation = await db.saveConversation(conversationData);
const history = await db.getRecentConversations(userId, 10);

// Crisis management
const crisis = await db.createCrisisEvent(crisisData);
const events = await db.getCrisisEvents(userId, false);

// Cost monitoring
const dailyCost = await db.getDailyCost(userId);
const usage = await db.getApiUsageStats(userId, 7);

// Progress tracking
const metric = await db.saveProgressMetric(metricData);
const progress = await db.getUserProgressMetrics(userId);
```

### Session Management

```typescript
// Context compression for long conversations
const session = await db.getUserSession(userId);
await db.updateUserSession(userId, {
  compressed_context: compressedData,
  messages_since_compression: 0
});
```

### Configuration Management

```typescript
// System configuration
const config = await db.getSystemConfig('crisis_keywords');
await db.updateSystemConfig('feature_flags', { newFeature: true });
```

## Environment Configuration

### Required Variables

```env
# Supabase
SUPABASE_URL=https://project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
SUPABASE_ANON_KEY=anon-key

# Telegram
TELEGRAM_BOT_TOKEN=bot-token
WEBHOOK_SECRET_TOKEN=webhook-secret

# OpenAI
OPENAI_API_KEY=openai-key

# Cost Limits
DAILY_COST_LIMIT_USD=0.50
MONTHLY_COST_LIMIT_USD=15.00
```

### Validation

```typescript
import { validateEnvironment, config } from '@/lib/config';

// Validates all required environment variables
validateEnvironment();

// Access configuration
const { supabase, openai, costs } = config;
```

## Subscription Tiers

```typescript
const subscriptions = {
  basic: {
    dailyMessageLimit: 15,
    monthlyCostLimit: 15.00,
    features: ['basic_chat', 'crisis_detection']
  },
  premium: {
    dailyMessageLimit: 50,
    monthlyCostLimit: 35.00,
    features: ['basic_chat', 'crisis_detection', 'progress_tracking', 'insights']
  },
  unlimited: {
    dailyMessageLimit: 1000,
    monthlyCostLimit: 75.00,
    features: ['all']
  }
};
```

## Safety Features

### Crisis Detection

- Automatic keyword detection
- Risk level assessment (0-10 scale)
- Immediate resource provision
- Human escalation protocols

### Data Protection

- Row Level Security on all tables
- Perfect user isolation
- Encrypted sensitive data
- GDPR compliance ready

### Cost Protection

- Per-user daily/monthly limits
- Real-time usage tracking
- Automatic throttling
- Cost alert thresholds

## Usage Examples

### Complete User Flow

```typescript
import { db } from '@/lib/database';
import type { DbUserInsert, DbConversationInsert } from '@/types';

// 1. Create new user
const userData: DbUserInsert = {
  telegram_id: 123456789,
  username: 'john_doe',
  first_name: 'John',
  subscription_tier: 'basic'
};
const user = await db.createUser(userData);

// 2. Save conversation
const conversationData: DbConversationInsert = {
  user_id: user.id,
  message_text: "I'm feeling overwhelmed",
  message_type: 'user',
  crisis_risk_level: 3,
  therapeutic_value: 7
};
await db.saveConversation(conversationData);

// 3. Track progress
await db.saveProgressMetric({
  user_id: user.id,
  metric_type: 'emotional',
  metric_name: 'stress_level',
  metric_value: 6,
  confidence_score: 0.8
});

// 4. Monitor costs
const dailyCost = await db.getDailyCost(user.id);
if (dailyCost > config.costs.dailyLimitUsd) {
  // Implement throttling
}
```

## Best Practices

1. **Always use typed operations** - Leverage TypeScript for compile-time safety
2. **Handle errors gracefully** - All database operations can throw
3. **Monitor costs continuously** - Track API usage in real-time
4. **Implement proper logging** - For debugging and monitoring
5. **Use transactions for related operations** - Ensure data consistency
6. **Validate inputs** - Sanitize all user inputs
7. **Implement proper error handling** - Graceful degradation
8. **Use connection pooling** - For performance at scale

## Performance Considerations

- Use appropriate indexes (already implemented)
- Implement query optimization
- Use connection pooling
- Monitor slow queries
- Consider read replicas for analytics

## Security Checklist

- ✅ Row Level Security enabled
- ✅ Service role for backend operations
- ✅ Input validation on all operations
- ✅ SQL injection prevention
- ✅ User data isolation
- ✅ Crisis detection logging
- ✅ Cost monitoring protection 