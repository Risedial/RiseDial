# User Manager Usage Examples

This document demonstrates how to use the UserManager system for handling user registration, psychological profiling, progress tracking, and report generation.

## Basic User Operations

### Creating or Updating a User

```typescript
import { userManager } from '@/lib/user-manager';

// When a user starts a conversation via Telegram
const telegramUser = {
  id: 12345,
  first_name: "Alex",
  username: "alex_user",
  language_code: "en"
};

// Create or update user profile
const userProfile = await userManager.createOrUpdateUser(telegramUser);

console.log(`User ${userProfile.first_name} is ready`);
console.log(`Onboarding completed: ${userProfile.onboarding_completed}`);
console.log(`Current stress level: ${userProfile.psychological_profile.stress_level}`);
```

### Getting User by Telegram ID

```typescript
const userId = 12345;
const user = await userManager.getUserByTelegramId(userId);

if (user) {
  console.log(`Found user: ${user.first_name}`);
  console.log(`Total sessions: ${user.progress_metrics.total_sessions}`);
  console.log(`Engagement score: ${user.progress_metrics.engagement_score}/10`);
} else {
  console.log('User not found');
}
```

## Psychological Profile Management

### Updating Psychological Assessment

```typescript
const userId = "user-123";

// After therapy session analysis
const psychUpdates = {
  stress_level: 6,          // Increased stress detected
  anxiety_level: 7,         // High anxiety in conversation
  emotional_state: "anxious",
  openness_level: 8,        // Very open in sharing
  crisis_risk_level: 2,     // Low but monitored
  coping_mechanisms: ["breathing exercises", "journaling"],
  therapeutic_goals: ["reduce anxiety", "improve sleep"]
};

const updatedUser = await userManager.updatePsychologicalProfile(userId, psychUpdates);

console.log(`Updated profile for ${updatedUser.first_name}`);
console.log(`New stress level: ${updatedUser.psychological_profile.stress_level}`);
```

### Crisis Risk Assessment

```typescript
// Monitor crisis risk level
if (user.psychological_profile.crisis_risk_level >= 6) {
  console.log("⚠️ High crisis risk detected");
  
  // Update with crisis management focus
  await userManager.updatePsychologicalProfile(user.id, {
    crisis_risk_level: user.psychological_profile.crisis_risk_level,
    coping_mechanisms: [
      ...user.psychological_profile.coping_mechanisms,
      "crisis hotline contact",
      "emergency support plan"
    ]
  });
}
```

## Session Tracking

### Recording Therapy Session

```typescript
const sessionData = {
  duration_minutes: 25,
  message_count: 12,
  therapeutic_value: 8,          // High therapeutic value (1-10)
  emotional_tone: "hopeful",
  crisis_detected: false,
  insights_gained: [
    "Recognized anxiety patterns",
    "Learned breathing technique",
    "Identified stress triggers"
  ],
  goals_worked_on: [
    "anxiety management",
    "stress reduction"
  ]
};

await userManager.trackSession(userId, sessionData);

console.log("Session tracked successfully");

// Get updated progress
const updatedUser = await userManager.getUserByTelegramId(12345);
console.log(`Total sessions: ${updatedUser.progress_metrics.total_sessions}`);
console.log(`New engagement score: ${updatedUser.progress_metrics.engagement_score}`);
```

### Tracking Crisis Session

```typescript
const crisisSessionData = {
  duration_minutes: 45,          // Longer crisis session
  message_count: 20,
  therapeutic_value: 6,          // Lower due to crisis state
  emotional_tone: "distressed",
  crisis_detected: true,         // Crisis flag
  insights_gained: [
    "Activated crisis management plan",
    "Connected with support resources"
  ],
  goals_worked_on: [
    "immediate safety",
    "crisis stabilization"
  ]
};

await userManager.trackSession(userId, crisisSessionData);

// Crisis incidents will be automatically incremented
// Last crisis date will be recorded
```

## Progress Reporting

### Generating Comprehensive Progress Report

```typescript
const userId = "user-123";
const progressReport = await userManager.generateProgressReport(userId);

console.log("=== PROGRESS REPORT ===");
console.log(`Report Date: ${progressReport.report_date}`);
console.log(`Time Period: ${progressReport.time_period}`);

// Current Metrics
console.log("\n📊 Current Metrics:");
console.log(`Total Sessions: ${progressReport.current_metrics.total_sessions}`);
console.log(`Engagement Score: ${progressReport.current_metrics.engagement_score}/10`);
console.log(`Therapeutic Progress: ${progressReport.current_metrics.therapeutic_progress}/10`);
console.log(`Crisis Incidents: ${progressReport.current_metrics.crisis_incidents}`);

// Psychological State
console.log("\n🧠 Psychological Profile:");
console.log(`Emotional State: ${progressReport.psychological_profile.emotional_state}`);
console.log(`Stress Level: ${progressReport.psychological_profile.stress_level}/10`);
console.log(`Resilience Score: ${progressReport.psychological_profile.resilience_score}/10`);

// Trends Analysis
console.log("\n📈 Trends:");
console.log(`Mood Trend: ${progressReport.trends.mood.trend} (${progressReport.trends.mood.change > 0 ? '+' : ''}${progressReport.trends.mood.change.toFixed(2)})`);
console.log(`Engagement Trend: ${progressReport.trends.engagement.trend}`);
console.log(`Progress Trend: ${progressReport.trends.progress.overall}`);

// Insights
console.log("\n💡 Key Insights:");
progressReport.insights.forEach(insight => {
  console.log(`• ${insight}`);
});

// Recommendations
console.log("\n🎯 Recommendations:");
progressReport.recommendations.forEach(rec => {
  console.log(`• ${rec}`);
});

// Achievements
if (progressReport.achievements.length > 0) {
  console.log("\n🏆 Achievements:");
  progressReport.achievements.forEach(achievement => {
    console.log(`• ${achievement}`);
  });
}

// Growth Areas
console.log("\n🌱 Areas for Growth:");
progressReport.areas_for_growth.forEach(area => {
  console.log(`• ${area}`);
});

// Next Milestones
console.log("\n🎯 Next Milestones:");
progressReport.next_milestones.forEach(milestone => {
  console.log(`• ${milestone}`);
});
```

### Using Progress Report for Personalization

```typescript
// Use progress report to personalize therapeutic approach
const report = await userManager.generateProgressReport(userId);

// Adjust therapeutic style based on engagement
if (report.trends.engagement.trend === 'declining') {
  await userManager.updatePsychologicalProfile(userId, {
    preferred_therapeutic_approaches: ['motivational_interviewing', 'solution_focused'],
    communication_style: 'supportive'
  });
  
  console.log("🔄 Adjusted therapeutic approach due to declining engagement");
}

// Celebrate achievements
if (report.achievements.length > 0) {
  console.log("🎉 Celebrating user achievements in next session");
}

// Focus on growth areas
if (report.areas_for_growth.includes("Building emotional resilience")) {
  console.log("🎯 Planning resilience-building exercises");
}
```

## Integration with AI Orchestrator

### Using UserManager with AI System

```typescript
import { userManager } from '@/lib/user-manager';
import { aiOrchestrator } from '@/lib/ai-orchestrator';

async function handleUserMessage(telegramUser: any, message: string) {
  // 1. Create/update user profile
  const user = await userManager.createOrUpdateUser(telegramUser);
  
  // 2. Get AI response using user context
  const response = await aiOrchestrator.processMessage(user.id, message, {
    psychological_profile: user.psychological_profile,
    progress_metrics: user.progress_metrics,
    preferences: user.preferences
  });
  
  // 3. Track the interaction
  if (response.session_data) {
    await userManager.trackSession(user.id, {
      duration_minutes: response.session_data.duration_minutes || 5,
      message_count: 1,
      therapeutic_value: response.therapeutic_value || 5,
      emotional_tone: response.emotional_tone || 'neutral',
      crisis_detected: response.crisis_detected || false,
      insights_gained: response.insights || [],
      goals_worked_on: response.goals || []
    });
  }
  
  // 4. Update psychological profile if analysis provided
  if (response.psychological_updates) {
    await userManager.updatePsychologicalProfile(user.id, response.psychological_updates);
  }
  
  return response.response;
}
```

## User Preferences Management

### Setting User Preferences

```typescript
// User preferences are managed internally, but can be influenced by:

// 1. Crisis contact setup
await userManager.updatePsychologicalProfile(userId, {
  // This would trigger preference updates internally
  crisis_risk_level: 3 // Moderate risk
});

// 2. Communication style preferences
await userManager.updatePsychologicalProfile(userId, {
  communication_style: "directive", // More structured approach
  preferred_therapeutic_approaches: ["CBT", "solution_focused"]
});
```

## Monitoring and Analytics

### Daily Progress Check

```typescript
async function dailyProgressCheck(userId: string) {
  const user = await userManager.getUserByTelegramId(userId);
  
  if (!user) return;
  
  const report = await userManager.generateProgressReport(user.id);
  
  // Check for concerning trends
  if (report.trends.mood.trend === 'declining' && report.trends.mood.change < -1) {
    console.log("⚠️ Significant mood decline detected");
    
    // Update crisis risk
    await userManager.updatePsychologicalProfile(user.id, {
      crisis_risk_level: Math.min(10, user.psychological_profile.crisis_risk_level + 1)
    });
  }
  
  // Celebrate progress
  if (report.trends.progress.overall === 'accelerating') {
    console.log("🚀 User showing accelerated progress!");
  }
  
  return report;
}
```

### Batch User Analysis

```typescript
async function analyzeUserCohort(userIds: string[]) {
  const reports = await Promise.all(
    userIds.map(id => userManager.generateProgressReport(id))
  );
  
  // Aggregate insights
  const avgEngagement = reports.reduce((sum, r) => sum + r.current_metrics.engagement_score, 0) / reports.length;
  const avgProgress = reports.reduce((sum, r) => sum + r.current_metrics.therapeutic_progress, 0) / reports.length;
  
  console.log(`Cohort Analysis:`);
  console.log(`Average Engagement: ${avgEngagement.toFixed(1)}/10`);
  console.log(`Average Progress: ${avgProgress.toFixed(1)}/10`);
  
  // Identify patterns
  const improvingUsers = reports.filter(r => r.trends.mood.trend === 'improving').length;
  console.log(`${improvingUsers}/${reports.length} users showing mood improvement`);
}
```

## Error Handling

### Robust Error Handling

```typescript
async function safeUserOperation(telegramId: number) {
  try {
    const user = await userManager.getUserByTelegramId(telegramId);
    
    if (!user) {
      console.log('User not found, this should not happen after createOrUpdateUser');
      return null;
    }
    
    // Safe progress report generation
    const report = await userManager.generateProgressReport(user.id);
    return report;
    
  } catch (error) {
    console.error('Error in user operation:', error);
    
    // Fallback: return basic user info
    try {
      return await userManager.getUserByTelegramId(telegramId);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
  }
}
```

This comprehensive user management system provides:

1. **Seamless User Registration** - Automatic user creation and profile setup
2. **Psychological Assessment** - Detailed mental health and emotional state tracking
3. **Progress Monitoring** - Comprehensive metrics and trend analysis
4. **Session Tracking** - Detailed conversation and therapeutic interaction logging
5. **Personalized Reporting** - Actionable insights and recommendations
6. **Crisis Management** - Risk assessment and safety monitoring
7. **Preferences Management** - User-specific therapeutic customization

The system integrates seamlessly with the existing Risedial architecture and database schema. 