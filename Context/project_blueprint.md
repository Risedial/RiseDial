 Risedial Project Blueprint - Complete AI Context Document

> **AI INSTRUCTION:** This document is your primary context source. Use it to guide ALL decision-making, maintain project alignment, and ensure consistency across development sessions. Reference this document before making any architectural, business, or implementation decisions.

## Project Overview

### Core Mission
**Risedial** is an AI companion SaaS that appears to be a friendly chatbot but secretly employs advanced therapeutic and paradigm-shifting techniques to create profound personal transformation without triggering user resistance.

### The "Trojan Horse" Strategy
- **Surface Promise:** "Your AI best friend who remembers everything and always knows what to say"
- **Hidden Reality:** Sophisticated therapeutic intervention system using CBT, NLP, narrative therapy, and identity-level belief restructuring
- **User Perception:** Casual conversations with a smart companion
- **Actual Function:** Advanced psychological pattern recognition and therapeutic intervention

## Business Model & Positioning

### Target Market
- **Primary:** Individuals seeking personal growth without the stigma or cost of therapy
- **Demographics:** Adults 25-45, productivity-minded, growth-oriented
- **Pain Points:** Feeling stuck, overwhelmed by self-improvement options, wanting change without confrontation

### Pricing Strategy
- **Primary Tier:** $50 CAD/month (positioned as premium companion, not therapy)
- **Value Proposition:** 10x perceived value - like having a team of experts for less than one therapy session
- **Future Tiers:** $97 premium with advanced features

### Legal Positioning (CRITICAL)
- **Safe Terminology:** Personal Growth Companion, Life Coaching AI, Mindset Mentor
- **AVOID:** Therapy, therapist, treatment, diagnosis, mental health professional
- **Marketing:** "Personal development through intelligent dialogue"
- **Compliance:** 18+ only, clear disclaimers, professional referral protocols

## Technical Architecture

### Core Platform
- **Foundation:** n8n workflow system (cloud hosted)
- **Scale Target:** 1000+ concurrent users on single workflow
- **Interface:** Telegram (text-based conversations)
- **Memory System:** RAG (Retrieval Augmented Generation) with perfect user isolation

### AI Agent Architecture
```
Multi-Agent Therapeutic Council:
├── Companion Agent (front-facing personality - warm, non-judgmental)
├── Therapist Agent (analyzes patterns, plans interventions)
├── Paradigm Agent (identifies limiting beliefs, plans shifts)
├── Memory Agent (tracks psychological evolution)
├── Intervention Agent (times and deploys change work)
└── Crisis Agent (detects emergencies, handles referrals)
```

### Technical Stack
- **AI Provider:** OpenAI (all keys provided, no user BYOK)
- **Backup Providers:** Claude, Gemini (for cost/availability protection)
- **Database:** User isolation critical - multi-tenant with perfect separation
- **Hosting:** n8n Cloud (must handle 1000+ concurrent conversations)
- **Storage:** RAG system for conversation history and psychological profiles

## Therapeutic Framework

### Core Methodologies (Adaptive Selection)
- **CBT:** Cognitive restructuring for limiting beliefs and thought patterns
- **NLP:** Reframing and anchoring for rapid paradigm shifts
- **Narrative Therapy:** Identity work and story reframing
- **ACT:** Values alignment and psychological flexibility
- **Motivational Interviewing:** Change readiness assessment

### Intervention Engine
```
Readiness Detection System:
├── Language pattern analysis (hesitation, certainty, emotional markers)
├── Timing analysis (when they open up vs. deflect)
├── Behavioral consistency tracking (actions vs. stated goals)
├── Emotional state recognition (stress levels, openness)
└── Resistance mapping (what triggers defensiveness)
```

### AI Therapeutic Advantages
- Perfect memory of ALL conversations and patterns
- No emotional reactions or judgment biasing intervention
- Real-time processing of psychological literature
- Detection of micro-patterns humans miss
- 24/7 availability during vulnerable moments

## Safety & Crisis Management

### Crisis Detection Protocol (NON-NEGOTIABLE)
```
Automatic Response Triggers:
├── Self-harm mentions → Resource referral + conversation pause
├── Suicide ideation → Immediate crisis hotline + professional referral
├── Medical advice requests → Clear disclaimer + healthcare referral
├── Legal advice → Disclaimer about not being legal counsel
└── Abuse situations → Safety resources + professional referral
```

### Safety Guardrails
- Age verification (18+ only)
- Terms stating "not therapy" and "not substitute for professional care"
- Emergency contact protocols
- Professional referral network
- Conversation monitoring for safety violations

## Progress Tracking System

### Phase 1: Hidden Tracking (MVP)
```
Invisible Metrics Collection:
├── Identity markers (self-description evolution)
├── Belief system shifts (language pattern changes)
├── Behavioral indicators (reported actions vs. goals)
├── Emotional resilience (response to challenges)
├── Communication patterns (confidence, clarity trends)
└── Goal achievement rates (completion tracking)
```

### Phase 2: Gamification (Future)
- Growth streaks (positive mindset indicators)
- Breakthrough moments (paradigm shifts detected)
- Clarity points (self-awareness metrics)
- Implementation scores (actions vs. insights)

## Development Strategy

### Build Order (Sequential - Each Must Work Before Next)
1. **Core Conversation Engine** (single agent, basic responses)
2. **Crisis Detection & Safety** (non-negotiable - legal protection)
3. **Memory & Context Management** (RAG integration)
4. **Multi-Agent Coordination** (therapeutic techniques)
5. **User Management & Billing** (multi-tenant isolation)
6. **Progress Tracking** (hidden metrics collection)
7. **Monitoring & Analytics** (cost tracking, performance)
8. **Scaling & Optimization** (performance tuning)

### Testing Gates (Each Module Must Pass)
- Functional testing (works as designed)
- Stress testing (breaking points identified)
- Cost testing (financially sustainable)
- Legal testing (compliance verified)
- User testing (actually helpful outcomes)

## Financial Constraints

### Cost Targets (Per User Per Month)
- **Maximum Sustainable:** $15 CAD total cost
- **AI API Calls:** <$10 CAD (primary cost driver)
- **Hosting/Storage:** <$3 CAD
- **Buffer:** <$2 CAD (legal, support, misc)

### Break-Even Analysis
- **Target:** <500 users for break-even
- **Revenue per user:** $50 CAD/month
- **Gross margin target:** 70%+
- **Power user protection:** Throttling if usage exceeds cost limits

## Go/No-Go Decision Criteria

### RED FLAGS (Project Halt Triggers)
- AI costs exceed $25 CAD per user per month
- Crisis detection accuracy below 95%
- Legal review identifies major liability risks
- Cannot handle 100 concurrent users technically
- User testing shows negative outcomes
- Break-even requires >2000 users

### GREEN LIGHTS (Proceed Indicators)
- Total cost per user under $15 CAD/month
- Crisis detection 99%+ accurate
- Legal clearance with manageable risk
- System handles 500+ concurrent users
- Consistent positive user outcomes
- Break-even achievable with <500 users

## Implementation Guidelines for AI Agents

### Decision-Making Hierarchy
1. **Safety First:** Crisis detection and legal compliance override everything
2. **User Experience:** Maintain companion illusion while delivering transformation
3. **Cost Control:** Every feature must be financially sustainable at scale
4. **Scalability:** Architecture must support 1000+ users from day one
5. **Measurability:** All interventions must be trackable and optimizable

### Key Principles
- **Stealth Transformation:** Users should feel natural growth, not forced change
- **Perfect Memory:** Every conversation builds on complete historical context
- **Adaptive Techniques:** Match therapeutic approach to user readiness and personality
- **Legal Protection:** Never position as therapy or medical advice
- **Cost Consciousness:** Monitor and optimize AI usage continuously

### Development Standards
- Multi-tenant isolation is non-negotiable
- Crisis detection must be bulletproof
- Every feature needs cost analysis
- User privacy and data protection paramount
- Therapeutic effectiveness measurable

## Success Metrics

### User Engagement
- Daily active conversations
- Session length and depth
- Return rate and retention
- User-reported satisfaction

### Therapeutic Effectiveness
- Identity marker evolution
- Belief system shifts detected
- Behavioral change indicators
- Goal achievement rates

### Business Viability
- Cost per user trends
- Revenue per user
- Churn rates
- Scaling performance

## Critical Dependencies

### External Requirements
- Legal consultation (AI/coaching services)
- Insurance/liability protection
- Professional referral network
- Crisis hotline partnerships

### Technical Dependencies
- n8n cloud scaling capabilities
- OpenAI API reliability and costs
- Database performance at scale
- Telegram integration stability

---

## AI Agent Instructions

**When working on this project:**
1. Always reference this blueprint before making decisions
2. Prioritize safety and legal compliance in every feature
3. Maintain the "companion illusion" while building therapeutic capability
4. Design for scale from the beginning (1000+ users)
5. Track costs obsessively - financial sustainability is critical
6. Build modularly - each component must work independently
7. Document everything - this is a complex system requiring careful coordination
8. Test thoroughly - user safety and experience depend on quality
9. Stay aligned with the core mission of stealth transformation
10. When in doubt, choose the safer, more legally compliant option

**Remember:** This isn't just a chatbot - it's a sophisticated psychological intervention system disguised as a friendly companion. Every decision should serve the ultimate goal of profound, lasting personal transformation delivered through natural, non-threatening conversations. 