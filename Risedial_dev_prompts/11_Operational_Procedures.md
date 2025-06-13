# Prompt 11: Establish Operational Procedures & Monitoring

## Context
You are creating Risedial's complete operational framework including monitoring systems, crisis response procedures, analytics dashboards, cost optimization workflows, user support processes, and business intelligence systems to ensure smooth day-to-day operations and continuous improvement.

## Required Reading
First, read these files to understand operational requirements:
- `Context/project_blueprint.md` - Business operations and KPI requirements
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - Operational architecture specifications
- `src/lib/cost-analytics.ts` - Analytics and monitoring systems (if created)
- `src/api/health/route.ts` - Health monitoring endpoints (if created)

## Task
Create comprehensive operational procedures covering system monitoring, crisis response, analytics reporting, cost optimization, user support, and business intelligence to maintain optimal service performance and business outcomes.

## Exact Expected Outputs

### 1. Crisis Response Procedures - docs/operations/crisis-response-procedures.md
Create comprehensive crisis management protocols:

```markdown
# Crisis Response Procedures

## Overview
This document outlines the complete crisis response procedures for Risedial, ensuring immediate and appropriate intervention when users express suicidal ideation or are in mental health crises.

## Crisis Detection Levels

### Level 1: Low Risk (Risk Score 1-3)
**Indicators:**
- General sadness or mild depression
- Work-related stress
- Relationship concerns
- Minor anxiety

**Response Protocol:**
- Continue normal therapeutic conversation
- Monitor for escalation in subsequent messages
- Suggest coping strategies and self-care
- Track progress in user profile

**Actions Required:**
- No immediate intervention
- Log risk assessment in database
- Continue monitoring user engagement

### Level 2: Medium Risk (Risk Score 4-6)
**Indicators:**
- Persistent hopelessness
- Social isolation
- Substance use mentions
- Sleep or appetite changes
- Life transition difficulties

**Response Protocol:**
- Provide enhanced emotional support
- Suggest professional resources
- Monitor closely for escalation
- Increase check-in frequency
- Document concerns in user profile

**Actions Required:**
- Flag account for enhanced monitoring
- Provide mental health resource list
- Follow up within 24 hours
- Consider suggesting professional consultation

### Level 3: High Risk (Risk Score 7-8)
**Indicators:**
- Direct statements of wanting to die
- Feeling trapped or hopeless
- Increased substance use
- Social withdrawal
- Previous suicide attempts

**Response Protocol:**
- Immediate crisis intervention response
- Provide crisis resources prominently
- Express concern and validation
- Encourage immediate professional help
- Create crisis event record

**Actions Required:**
1. Immediate crisis response message
2. Display crisis resources prominently
3. Create high-priority crisis event record
4. Alert monitoring team within 1 hour
5. Prepare for potential escalation

### Level 4: Critical Risk (Risk Score 9-10)
**Indicators:**
- Active suicidal plans
- Immediate intent to harm self
- Access to means of self-harm
- Goodbye messages
- Imminent danger statements

**Response Protocol:**
- Immediate crisis intervention
- Strong encouragement to call 911
- Display emergency contact options
- Attempt to maintain engagement
- Initiate emergency response protocols

**Actions Required:**
1. Send immediate crisis intervention message
2. Display emergency contact buttons
3. Create critical crisis event record
4. Alert crisis response team immediately
5. Document all interactions
6. Prepare to contact emergency services

## Crisis Response Team Structure

### Primary Response Team
- **Crisis Response Coordinator:** Overall incident management
- **Clinical Consultant:** Licensed mental health professional on-call
- **Technical Lead:** System monitoring and escalation management
- **Legal Advisor:** Compliance and liability guidance

### 24/7 Availability
- Primary on-call rotation for crisis response
- Secondary backup for high-volume periods
- Emergency escalation for critical situations
- Mental health professional consultation available

## Emergency Contact Protocols

### When to Contact Emergency Services
Contact 911 immediately when:
- User states immediate plan to harm self
- User has means and intent for suicide
- User mentions active self-harm in progress
- User stops responding after critical risk assessment
- Legal obligation requires emergency intervention

### Information Required for Emergency Services
1. User's full name (if available)
2. Location information (if available)
3. Nature of the emergency (suicidal ideation/self-harm)
4. Risk factors identified
5. User's current mental state
6. Any known medical history
7. Contact information available

### Documentation Requirements
- Complete conversation logs
- Risk assessment details
- Actions taken and timeline
- Emergency services contacted
- Outcomes and follow-up required

## Crisis Communication Templates

### Immediate Crisis Response
```
🚨 I'm concerned about your safety right now.

What you're feeling is real and painful, but there are people who can help you through this moment.

**Please reach out immediately:**
🆘 Emergency: 911
📞 Crisis Lifeline: 988
💬 Crisis Text: Text HOME to 741741

You are not alone, and you don't have to face this by yourself. These trained professionals understand what you're going through and can provide immediate support.

Can you please contact one of these resources right now?
```

### Sustained Engagement Script
```
I hear how much pain you're in right now. These feelings can be overwhelming, but they are temporary. 

You've reached out to me, which shows incredible strength. That same strength can help you take the next step to get the support you deserve.

There are people trained specifically to help in situations like this. They understand what you're going through and can provide immediate, professional support.

Will you please call 988 (Suicide & Crisis Lifeline) right now? They're available 24/7 and you can speak with someone immediately.

I'll be here when you're ready to continue our conversation.
```

## Follow-Up Procedures

### Post-Crisis Follow-Up
1. **24-Hour Check-In:** Automated or manual follow-up message
2. **Professional Resource Verification:** Confirm user contacted professional help
3. **Progress Monitoring:** Enhanced tracking for 30 days post-crisis
4. **Documentation Review:** Complete incident documentation
5. **Team Debrief:** Review response effectiveness and improvements

### Long-Term Support
- Continued enhanced monitoring
- Regular mental health resource reminders
- Professional consultation encouragement
- Progress tracking with crisis context
- Therapeutic relationship rebuilding

## Legal and Compliance Considerations

### Mandatory Reporting Requirements
- Imminent danger to self or others
- Child abuse or neglect (if applicable)
- Elder abuse (if applicable)
- Legal obligations by jurisdiction

### Documentation Standards
- Complete conversation records
- Risk assessment documentation
- Actions taken and reasoning
- Emergency service contact logs
- Follow-up and outcome tracking

### Privacy Considerations
- HIPAA compliance for health information
- Crisis information sharing protocols
- Emergency override of privacy preferences
- Legal disclosure requirements

## Quality Assurance

### Crisis Response Audits
- Monthly review of all crisis events
- Response time analysis
- Outcome tracking and effectiveness
- Process improvement recommendations

### Training Requirements
- Crisis intervention training for all team members
- Regular updates on best practices
- Mental health professional consultation
- Legal and compliance training

### Continuous Improvement
- Regular procedure updates based on outcomes
- Integration of new crisis intervention research
- Technology improvements for faster response
- Collaboration with mental health professionals

## Crisis Resource Directory

### National Resources (US)
- **National Suicide Prevention Lifeline:** 988
- **Crisis Text Line:** Text HOME to 741741
- **National Domestic Violence Hotline:** 1-800-799-7233
- **SAMHSA National Helpline:** 1-800-662-4357

### International Resources
- **International Association for Suicide Prevention:** iasp.info
- **Crisis Centre Locator:** findahelpline.com
- **Samaritans (UK):** 116 123
- **Crisis Services Canada:** 1-833-456-4566

### Specialized Support
- **LGBT National Suicide Hotline:** 1-866-488-7386
- **Veterans Crisis Line:** 1-800-273-8255
- **Teen Line:** 1-800-852-8336
- **National Eating Disorders Association:** 1-800-931-2237

---

**Last Updated:** [Date]
**Next Review:** [Date + 90 days]
**Contact:** crisis-team@risedial.com
```

### 2. Monitoring Dashboard Setup - docs/operations/monitoring-dashboard.md
Create comprehensive system monitoring specifications:

```markdown
# System Monitoring Dashboard Specifications

## Dashboard Overview
The Risedial monitoring dashboard provides real-time visibility into system health, user engagement, crisis events, cost management, and business performance metrics.

## Core Metrics Dashboard

### System Health Panel
**Real-Time Indicators:**
- System uptime percentage (target: 99.9%)
- Response time average (target: <2 seconds)
- Error rate percentage (target: <0.1%)
- Active user sessions count
- Database connection health
- API endpoint availability

**Visual Elements:**
- Green/yellow/red status indicators
- Response time line graph (last 24 hours)
- System uptime gauge
- Active sessions counter
- Error rate trend chart

### User Engagement Panel
**Key Metrics:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Monthly active users (MAU)
- Average session duration
- Messages per user per day
- User retention rates
- Subscription conversion rates

**Visualizations:**
- User growth line chart
- Engagement heatmap by hour/day
- Retention cohort analysis
- Conversion funnel visualization

### Crisis Monitoring Panel
**Critical Alerts:**
- Active crisis events (Level 3-4)
- Crisis events in last 24 hours
- Response time to crisis events
- Crisis escalation rates
- Emergency service contact frequency

**Alert System:**
- Red alert for Level 4 crises (immediate)
- Yellow alert for Level 3 crises (1 hour)
- Crisis event timeline
- Response team status indicator
- Geographic crisis distribution map

### Cost Management Panel
**Financial Metrics:**
- Daily API costs
- Cost per user
- Monthly burn rate
- Profit margin percentage
- Budget vs. actual spending
- Cost per conversation

**Optimization Tracking:**
- Token usage efficiency
- Model cost comparison
- User tier profitability
- Cost trend analysis
- Budget forecast accuracy

## Alert Configuration

### Critical Alerts (Immediate Notification)
1. **System Down:** Any core service unavailable
2. **Crisis Level 4:** Critical suicide risk detected
3. **High Error Rate:** Error rate >1% for 5+ minutes
4. **Cost Spike:** Daily costs exceed 150% of average
5. **Security Breach:** Unauthorized access detected

### Warning Alerts (15-minute delay)
1. **Performance Degradation:** Response time >5 seconds
2. **Crisis Level 3:** High suicide risk detected
3. **Elevated Error Rate:** Error rate >0.5% for 10+ minutes
4. **Cost Increase:** Daily costs exceed 120% of average
5. **Unusual Traffic:** Request volume >200% of normal

### Information Alerts (1-hour delay)
1. **Maintenance Required:** Scheduled maintenance reminders
2. **Resource Usage:** Memory/CPU usage >80%
3. **User Engagement:** Significant changes in user metrics
4. **Cost Trending:** Weekly cost variance >10%

## Key Performance Indicators (KPIs)

### Business KPIs
- **Monthly Recurring Revenue (MRR)**
  - Target: Month-over-month growth
  - Calculation: Sum of all active subscriptions
  - Tracking: Daily updates with trend analysis

- **Customer Acquisition Cost (CAC)**
  - Target: <$50 per user
  - Calculation: Total acquisition cost / new users
  - Tracking: Weekly calculation with channel breakdown

- **Customer Lifetime Value (CLV)**
  - Target: >$150 per user
  - Calculation: Average revenue per user × retention rate
  - Tracking: Monthly calculation with cohort analysis

- **Churn Rate**
  - Target: <5% monthly
  - Calculation: Users cancelled / total users
  - Tracking: Daily monitoring with retention analysis

### Operational KPIs
- **Crisis Response Time**
  - Target: <5 minutes for Level 4, <60 minutes for Level 3
  - Calculation: Time from detection to first response
  - Tracking: Real-time monitoring with historical trends

- **System Availability**
  - Target: 99.9% uptime
  - Calculation: (Total time - downtime) / total time
  - Tracking: Continuous monitoring with incident tracking

- **User Satisfaction**
  - Target: >4.5/5 average rating
  - Calculation: Average of user feedback ratings
  - Tracking: Weekly surveys with trend analysis

### Therapeutic KPIs
- **Crisis Detection Accuracy**
  - Target: >99% accuracy
  - Calculation: Correct detections / total assessments
  - Tracking: Monthly validation with test cases

- **Therapeutic Value Score**
  - Target: >7/10 average
  - Calculation: AI-assessed therapeutic value of responses
  - Tracking: Daily monitoring with quality improvement

- **User Progress Indicators**
  - Target: Measurable improvement in 80% of users
  - Calculation: Positive change in psychological metrics
  - Tracking: Monthly analysis with longitudinal studies

## Dashboard Access Control

### Role-Based Access
**Executive Dashboard:**
- Business KPIs and financial metrics
- High-level system health
- Strategic decision support
- Monthly/quarterly reporting

**Operations Dashboard:**
- System health and performance
- User engagement metrics
- Technical issue tracking
- Daily operations management

**Crisis Response Dashboard:**
- Real-time crisis monitoring
- Emergency response tools
- Crisis event management
- Resource allocation tracking

**Development Dashboard:**
- Technical performance metrics
- Error tracking and debugging
- API usage and optimization
- Development progress tracking

## Real-Time Alerting

### Notification Channels
1. **Slack Integration:** Real-time alerts to operations channel
2. **Email Alerts:** Critical issues and daily summaries
3. **SMS Notifications:** Level 4 crisis events only
4. **Dashboard Notifications:** In-app alert system
5. **PagerDuty Integration:** 24/7 on-call management

### Alert Routing Rules
- **Crisis Events:** Crisis response team + on-call manager
- **System Issues:** Technical team + operations manager
- **Business Alerts:** Business team + executives
- **Security Issues:** Security team + technical lead

## Reporting Automation

### Daily Reports
- System health summary
- User engagement metrics
- Crisis events summary
- Cost and performance overview
- Action items for next day

### Weekly Reports
- Business KPI dashboard
- User retention analysis
- Crisis response effectiveness
- Cost optimization opportunities
- Development progress update

### Monthly Reports
- Comprehensive business review
- Therapeutic effectiveness analysis
- Financial performance and forecasting
- System reliability and improvements
- Strategic planning insights

## Data Integration

### Data Sources
- Supabase database (user data, conversations, crises)
- OpenAI API (usage and costs)
- Telegram API (message delivery and engagement)
- Vercel Analytics (system performance)
- Custom application logs (business logic)

### Data Processing
- Real-time streaming for critical metrics
- Hourly aggregation for trends
- Daily batch processing for reports
- Weekly analysis for strategic insights

### Data Storage
- Time-series database for metrics
- Data warehouse for analytics
- Real-time cache for dashboard
- Archive storage for historical data

---

**Last Updated:** [Date]
**Dashboard URL:** https://dashboard.risedial.com
**Support Contact:** operations@risedial.com
```

### 3. Cost Optimization Procedures - docs/operations/cost-optimization.md
Create comprehensive cost management protocols:

```markdown
# Cost Optimization Procedures

## Overview
This document outlines systematic procedures for monitoring, analyzing, and optimizing costs across all aspects of Risedial operations to maintain the target <$15 CAD monthly cost per user while achieving 95%+ profit margins.

## Cost Monitoring Framework

### Real-Time Cost Tracking
**Automated Monitoring:**
- OpenAI API usage and costs per request
- Token consumption by conversation and user
- Database operation costs and storage usage
- Infrastructure costs (Vercel, Supabase)
- Third-party service usage and fees

**Cost Allocation:**
- Direct costs: AI processing, database operations
- Indirect costs: Infrastructure, monitoring, support
- Fixed costs: Platform subscriptions, tooling
- Variable costs: Usage-based services

### Cost per User Analysis
**Calculation Methodology:**
```
Daily Cost per User = (
  AI Processing Costs +
  Database Operations +
  Infrastructure Allocation +
  Support Costs
) / Active Users

Monthly Cost per User = Daily Average × 30.44
```

**Target Thresholds:**
- Basic Tier: <$8 CAD monthly cost per user
- Premium Tier: <$12 CAD monthly cost per user
- Unlimited Tier: <$15 CAD monthly cost per user

## AI Cost Optimization

### Token Usage Optimization
**Context Compression:**
- Implement sliding window for conversation history
- Prioritize recent and high-importance messages
- Summarize older conversation content
- Remove redundant information from context

**Model Selection Strategy:**
- Use GPT-3.5-turbo for routine conversations
- Reserve GPT-4 for crisis situations and complex cases
- Implement dynamic model switching based on conversation complexity
- A/B test model performance vs. cost trade-offs

**Prompt Engineering:**
- Optimize system prompts for token efficiency
- Use structured output formats to reduce response length
- Implement template-based responses for common scenarios
- Regular prompt performance and cost analysis

### Response Optimization
**Smart Caching:**
- Cache common therapeutic responses
- Implement similarity matching for repeated queries
- Store and reuse crisis intervention templates
- Cache user profile assessments

**Batch Processing:**
- Group multiple user requests when possible
- Implement delayed processing for non-urgent requests
- Optimize API call timing and frequency
- Use background processing for analytics

## Infrastructure Cost Management

### Database Optimization
**Query Efficiency:**
- Optimize database queries for performance
- Implement proper indexing strategies
- Use database connection pooling
- Regular performance monitoring and optimization

**Storage Management:**
- Implement data retention policies
- Archive old conversation data
- Compress stored data efficiently
- Monitor storage growth and costs

### Platform Cost Control
**Vercel Optimization:**
- Monitor function execution time and costs
- Optimize serverless function performance
- Implement edge caching where appropriate
- Regular review of usage and billing

**Supabase Management:**
- Monitor database usage and costs
- Optimize storage and bandwidth usage
- Review and adjust database configuration
- Regular cost analysis and optimization

## User Tier Cost Analysis

### Basic Tier Economics
**Cost Structure:**
- Target: <$8 CAD per user per month
- Revenue: $9.99 CAD per month
- Target Margin: 20%

**Optimization Strategies:**
- Limit daily message volume (15 messages)
- Use efficient AI models for basic interactions
- Implement basic crisis detection only
- Minimal progress tracking and analytics

### Premium Tier Economics
**Cost Structure:**
- Target: <$12 CAD per user per month
- Revenue: $19.99 CAD per month
- Target Margin: 40%

**Optimization Strategies:**
- Increased message volume (50 messages)
- Enhanced AI models for better responses
- Advanced crisis detection and intervention
- Comprehensive progress tracking

### Unlimited Tier Economics
**Cost Structure:**
- Target: <$15 CAD per user per month
- Revenue: $39.99 CAD per month
- Target Margin: 62%

**Optimization Strategies:**
- Unlimited messaging with smart throttling
- Premium AI models and advanced features
- Priority crisis response and intervention
- Advanced analytics and insights

## Cost Alert System

### Automated Cost Alerts
**Threshold Alerts:**
- Daily cost per user exceeds target by 20%
- Weekly cost trend indicates monthly overage
- Individual user costs exceed tier limits
- Total daily costs exceed budget by 15%

**Escalation Procedures:**
1. **Level 1 (110% of target):** Automated optimization triggers
2. **Level 2 (125% of target):** Operations team notification
3. **Level 3 (150% of target):** Management escalation
4. **Level 4 (200% of target):** Emergency cost reduction measures

### Response Procedures
**Immediate Actions (Level 1):**
- Activate cost reduction algorithms
- Implement conversation length limits
- Switch to more efficient AI models
- Increase caching utilization

**Operational Response (Level 2):**
- Manual review of cost drivers
- User behavior analysis
- Infrastructure optimization review
- Cost allocation verification

**Management Escalation (Level 3):**
- Executive team notification
- Business impact assessment
- Strategic cost reduction planning
- Resource allocation review

**Emergency Measures (Level 4):**
- Temporary service limitations
- Emergency model switching
- Critical feature prioritization
- Immediate vendor negotiations

## Optimization Strategies

### AI Model Efficiency
**Model Performance Analysis:**
- Response quality vs. cost comparison
- User satisfaction correlation with model choice
- Crisis detection accuracy by model
- Therapeutic value assessment by cost

**Dynamic Model Selection:**
```
if (crisis_risk_level >= 7) {
  use_model = "gpt-4"  // Highest accuracy for crises
} else if (user_tier == "unlimited") {
  use_model = "gpt-4"  // Premium experience
} else if (conversation_complexity > 0.7) {
  use_model = "gpt-3.5-turbo-16k"  // Complex conversations
} else {
  use_model = "gpt-3.5-turbo"  // Standard conversations
}
```

### Context Optimization
**Conversation History Management:**
- Keep last 10 messages for immediate context
- Summarize 11-50 messages for medium-term context
- Store key insights and patterns for long-term context
- Archive conversations older than 90 days

**User Profile Efficiency:**
- Update profiles based on significant changes only
- Cache frequently accessed profile data
- Compress psychological assessment data
- Regular profile relevance review

### Infrastructure Optimization
**Serverless Function Optimization:**
- Minimize cold start times
- Optimize function memory allocation
- Implement connection pooling
- Regular performance monitoring

**Database Optimization:**
- Implement read replicas for analytics
- Use appropriate data types and compression
- Regular index optimization
- Query performance monitoring

## Revenue Optimization

### Pricing Strategy Analysis
**Cost-Based Pricing:**
- Ensure positive margins on all tiers
- Regular pricing review based on costs
- Competitive analysis and positioning
- Value proposition optimization

**Upselling Opportunities:**
- Identify users approaching limits
- Provide value-based upgrade recommendations
- Implement usage-based upgrade prompts
- Track conversion rates and optimize

### Feature Optimization
**Cost-Effective Features:**
- Focus on high-value, low-cost features
- Regular feature ROI analysis
- User engagement vs. cost correlation
- Feature usage tracking and optimization

## Reporting and Analysis

### Daily Cost Reports
- Total costs by category
- Cost per user by tier
- Trending and forecasting
- Alert summary and actions taken

### Weekly Optimization Reviews
- Cost reduction measure effectiveness
- User behavior impact on costs
- Infrastructure optimization opportunities
- Revenue optimization analysis

### Monthly Strategic Analysis
- Profit margin analysis by tier
- Cost trend analysis and forecasting
- Competitive cost positioning
- Strategic cost reduction opportunities

---

**Last Updated:** [Date]
**Review Schedule:** Weekly operations review
**Contact:** finance@risedial.com
```

## Validation Requirements
After creating all files:
1. Test crisis response procedures with mock scenarios
2. Validate monitoring dashboard displays accurate real-time data
3. Verify cost optimization procedures maintain service quality
4. Test alert systems and escalation procedures
5. Ensure operational procedures integrate with existing systems
6. Train operations team on all procedures and systems

## Success Criteria
- [ ] Crisis response procedures ensure <5 minute response time
- [ ] Monitoring dashboard provides real-time operational visibility
- [ ] Cost optimization maintains <$15 CAD monthly cost per user
- [ ] Alert systems provide timely notifications without false positives
- [ ] Operational procedures support 99.9% system uptime
- [ ] Business intelligence enables data-driven decision making 