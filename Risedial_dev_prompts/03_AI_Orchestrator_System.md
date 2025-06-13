# Prompt 3: Build Multi-Agent AI Orchestrator System

## Context
You are building Risedial's core AI system that orchestrates multiple therapeutic agents (Companion, Therapist, Paradigm, Memory) in a single optimized API call. This system must provide sophisticated therapeutic responses while maintaining cost efficiency and context awareness.

## Required Reading
First, read these files to understand the AI system requirements:
- `Context/project_blueprint.md` - Multi-agent system design and therapeutic framework
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - AI orchestrator specifications
- `src/types/database.ts` - Database types (if created)
- `src/types/conversation.ts` - AI response types (if created)

## Task
Create the multi-agent AI orchestrator that combines Companion, Therapist, Paradigm, and Memory agents into a single optimized system with context compression and cost tracking.

## Exact Expected Outputs

### 1. Main AI Orchestrator - src/lib/ai-orchestrator.ts
Create the core orchestrator that manages all agents:

```typescript
import OpenAI from 'openai';
import { config } from './config';
import { db } from './database';
import { MessageContext, AIResponse, AgentAnalysis, ResponseMetadata } from '@/types/conversation';
import { CompanionAgent } from './agents/companion-agent';
import { TherapistAgent } from './agents/therapist-agent';
import { ParadigmAgent } from './agents/paradigm-agent';
import { MemoryAgent } from './agents/memory-agent';
import { CrisisDetector } from './crisis-detection';
import { TokenCounter } from '@/utils/token-counter';

export class AIOrchestrator {
  private openai: OpenAI;
  private companionAgent: CompanionAgent;
  private therapistAgent: TherapistAgent;
  private paradigmAgent: ParadigmAgent;
  private memoryAgent: MemoryAgent;
  private crisisDetector: CrisisDetector;
  private tokenCounter: TokenCounter;

  constructor() {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.companionAgent = new CompanionAgent();
    this.therapistAgent = new TherapistAgent();
    this.paradigmAgent = new ParadigmAgent();
    this.memoryAgent = new MemoryAgent();
    this.crisisDetector = new CrisisDetector();
    this.tokenCounter = new TokenCounter();
  }

  async generateResponse(userMessage: string, context: MessageContext): Promise<AIResponse> {
    const startTime = Date.now();
    let totalTokensUsed = 0;
    let totalCost = 0;

    try {
      // Step 1: Analyze user input and detect crisis
      const inputAnalysis = await this.analyzeInput(userMessage, context);
      totalTokensUsed += inputAnalysis.tokens_used;

      // Step 2: If crisis detected, handle immediately
      if (inputAnalysis.crisis_risk_level >= 8) {
        return await this.handleCrisisResponse(userMessage, context, inputAnalysis);
      }

      // Step 3: Prepare compressed context for agents
      const compressedContext = await this.memoryAgent.compressContext(context);
      totalTokensUsed += compressedContext.tokens_used;

      // Step 4: Generate unified response using all agents
      const agentResponse = await this.orchestrateAgents(
        userMessage, 
        context, 
        compressedContext.compressed_context,
        inputAnalysis
      );
      totalTokensUsed += agentResponse.tokens_used;

      // Step 5: Calculate final costs
      totalCost = this.tokenCounter.calculateCost(totalTokensUsed, config.openai.defaultModel);

      // Step 6: Track API usage
      await this.trackUsage(context.userId, totalTokensUsed, totalCost);

      const response: AIResponse = {
        companion_response: agentResponse.companion_response,
        emotional_tone: agentResponse.emotional_tone,
        confidence_level: agentResponse.confidence_level,
        therapeutic_techniques: agentResponse.therapeutic_techniques,
        crisis_risk_level: inputAnalysis.crisis_risk_level,
        therapeutic_value: agentResponse.therapeutic_value,
        key_insights: agentResponse.key_insights,
        agent_analysis: agentResponse.agent_analysis,
        response_metadata: {
          tokens_used: totalTokensUsed,
          cost_usd: totalCost,
          response_time_ms: Date.now() - startTime,
          model_used: config.openai.defaultModel,
          processing_stages: [
            { stage: 'input_analysis', duration_ms: 200, tokens_used: inputAnalysis.tokens_used, status: 'success' },
            { stage: 'agent_processing', duration_ms: Date.now() - startTime - 200, tokens_used: agentResponse.tokens_used, status: 'success' }
          ]
        }
      };

      return response;

    } catch (error) {
      console.error('AI Orchestrator error:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  private async analyzeInput(userMessage: string, context: MessageContext) {
    const crisisAnalysis = this.crisisDetector.analyzeCrisisRisk(userMessage, context);
    
    const analysisPrompt = `
Analyze this user message for emotional tone, therapeutic needs, and context:
Message: "${userMessage}"

Recent context: ${JSON.stringify(context.messageHistory.slice(-3))}

Provide analysis in JSON format:
{
  "emotional_tone": "primary emotion detected",
  "confidence_level": 1-10,
  "therapeutic_needs": ["identified needs"],
  "intervention_priority": "low|medium|high",
  "communication_style": "current style observed"
}`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.defaultModel,
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.3,
      max_tokens: 300
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    const tokensUsed = this.tokenCounter.countTokens(analysisPrompt + (response.choices[0].message.content || ''));

    return {
      ...analysis,
      crisis_risk_level: crisisAnalysis.riskLevel,
      tokens_used: tokensUsed
    };
  }

  private async orchestrateAgents(
    userMessage: string, 
    context: MessageContext, 
    compressedContext: any,
    inputAnalysis: any
  ) {
    // Single comprehensive prompt that incorporates all four agents
    const unifiedPrompt = `
You are Risedial, an AI therapeutic companion with four integrated perspectives:

1. COMPANION AGENT: Provide empathy, validation, and emotional support
2. THERAPIST AGENT: Apply evidence-based therapeutic techniques (CBT, NLP, ACT)
3. PARADIGM AGENT: Identify and reframe limiting beliefs, suggest identity shifts
4. MEMORY AGENT: Connect patterns, track progress, provide context awareness

USER PROFILE:
${JSON.stringify(context.userProfile || {})}

COMPRESSED CONVERSATION HISTORY:
${JSON.stringify(compressedContext)}

CURRENT INPUT ANALYSIS:
${JSON.stringify(inputAnalysis)}

USER MESSAGE: "${userMessage}"

Generate a therapeutic response that integrates all four perspectives. Respond in JSON format:

{
  "companion_response": "Your empathetic, supportive response to the user (2-3 paragraphs)",
  "emotional_tone": "primary tone (supportive/curious/encouraging/validating)",
  "confidence_level": 1-10,
  "therapeutic_techniques": ["specific techniques used"],
  "therapeutic_value": 1-10,
  "key_insights": ["important insights about user's situation"],
  "agent_analysis": {
    "companion": {
      "empathy_score": 1-10,
      "validation_provided": true/false,
      "rapport_building": ["specific rapport elements"]
    },
    "therapist": {
      "techniques_used": ["CBT reframe", "exploratory question"],
      "intervention_type": "cognitive|behavioral|emotional|relational",
      "effectiveness_prediction": 1-10
    },
    "paradigm": {
      "limiting_beliefs_identified": ["beliefs that hold user back"],
      "reframe_opportunities": ["new perspectives to offer"],
      "identity_shifts_suggested": ["growth opportunities"]
    },
    "memory": {
      "patterns_recognized": ["behavioral/emotional patterns"],
      "progress_indicators": ["signs of growth/change"],
      "context_connections": ["how this relates to past conversations"]
    }
  }
}

GUIDELINES:
- Be warm, non-judgmental, and genuinely supportive
- Use the user's name and reference their history when appropriate
- Ask thoughtful follow-up questions
- Provide specific, actionable insights
- Balance validation with gentle challenges for growth
- Maintain therapeutic boundaries while being personable
- If crisis risk detected, focus on immediate support and safety`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.defaultModel,
      messages: [{ role: 'user', content: unifiedPrompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const agentResponse = JSON.parse(response.choices[0].message.content || '{}');
    const tokensUsed = this.tokenCounter.countTokens(unifiedPrompt + (response.choices[0].message.content || ''));

    return {
      ...agentResponse,
      tokens_used: tokensUsed
    };
  }

  private async handleCrisisResponse(userMessage: string, context: MessageContext, analysis: any): Promise<AIResponse> {
    const crisisResponse = await this.crisisDetector.generateCrisisResponse(userMessage, context);
    
    return {
      companion_response: crisisResponse.message,
      emotional_tone: 'supportive_urgent',
      confidence_level: 10,
      therapeutic_techniques: ['crisis_intervention', 'safety_planning'],
      crisis_risk_level: analysis.crisis_risk_level,
      therapeutic_value: 10,
      key_insights: ['User in crisis - immediate support needed'],
      agent_analysis: {
        companion: { empathy_score: 10, validation_provided: true, rapport_building: ['crisis_support'] },
        therapist: { techniques_used: ['crisis_intervention'], intervention_type: 'crisis', effectiveness_prediction: 9 },
        paradigm: { limiting_beliefs_identified: [], reframe_opportunities: [], identity_shifts_suggested: [] },
        memory: { patterns_recognized: ['crisis_pattern'], progress_indicators: [], context_connections: [] }
      },
      response_metadata: {
        tokens_used: 500, // Estimated for crisis response
        cost_usd: 0.015,
        response_time_ms: 200,
        model_used: 'crisis_protocol',
        processing_stages: [
          { stage: 'safety_check', duration_ms: 200, tokens_used: 500, status: 'success' }
        ]
      }
    };
  }

  private async trackUsage(userId: string, tokens: number, cost: number) {
    await db.trackApiUsage({
      user_id: userId,
      api_provider: 'openai',
      model_used: config.openai.defaultModel,
      tokens_total: tokens,
      cost_usd: cost,
      request_type: 'conversation',
      created_at: new Date().toISOString()
    });
  }
}

export const aiOrchestrator = new AIOrchestrator();
```

### 2. Companion Agent - src/lib/agents/companion-agent.ts
Create the empathy and rapport-building agent:

```typescript
export class CompanionAgent {
  
  generateEmpathyResponse(userMessage: string, emotionalTone: string): string {
    // Core empathy patterns based on emotional tone
    const empathyPatterns = {
      'anxious': [
        "I can hear the worry in your message, and that must feel overwhelming.",
        "It sounds like you're carrying a lot of anxiety right now. That's really hard.",
        "I understand why you'd feel anxious about this - it's a significant situation."
      ],
      'sad': [
        "I can sense the sadness in your words, and I want you to know that what you're feeling matters.",
        "It sounds like you're going through a really difficult time. I'm here with you.",
        "Your sadness is valid, and it's okay to feel this way."
      ],
      'frustrated': [
        "I can feel the frustration in your message - this situation sounds really challenging.",
        "It's completely understandable that you'd feel frustrated by this.",
        "That sounds incredibly frustrating. Your feelings make complete sense."
      ],
      'hopeful': [
        "I can hear the hope in your words, and that's beautiful.",
        "There's something really powerful about the hope you're expressing.",
        "I love hearing this sense of possibility in your message."
      ],
      'confused': [
        "It sounds like you're working through some complex thoughts and feelings.",
        "Confusion can be really uncomfortable - you're trying to make sense of a lot.",
        "It's okay to feel uncertain. Sometimes clarity comes gradually."
      ]
    };

    const patterns = empathyPatterns[emotionalTone] || empathyPatterns['confused'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  buildRapport(userHistory: any[], userProfile: any): string[] {
    const rapportElements = [];

    // Reference user's name if available
    if (userProfile?.first_name) {
      rapportElements.push(`name_usage: ${userProfile.first_name}`);
    }

    // Reference past conversations
    if (userHistory.length > 0) {
      rapportElements.push('conversation_continuity');
    }

    // Match communication style
    if (userProfile?.communication_style?.preferred_pace) {
      rapportElements.push(`pace_matching: ${userProfile.communication_style.preferred_pace}`);
    }

    return rapportElements;
  }

  assessEmpathyScore(response: string): number {
    const empathyIndicators = [
      'I understand', 'I hear', 'I can see', 'I feel', 'I sense',
      'That sounds', 'It seems like', 'I can imagine',
      'Your feelings', 'That must be', 'I\'m here'
    ];

    let score = 0;
    empathyIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator.toLowerCase())) {
        score += 1;
      }
    });

    return Math.min(score * 2, 10); // Scale to 1-10
  }
}
```

### 3. Therapist Agent - src/lib/agents/therapist-agent.ts
Create the therapeutic intervention agent:

```typescript
export class TherapistAgent {
  
  selectTherapeuticTechniques(userMessage: string, context: any): string[] {
    const techniques = [];

    // CBT techniques for cognitive distortions
    if (this.hasCognitiveDistortion(userMessage)) {
      techniques.push('cognitive_restructuring', 'thought_challenging');
    }

    // Behavioral interventions for action-related issues
    if (this.needsBehavioralChange(userMessage)) {
      techniques.push('behavioral_activation', 'problem_solving');
    }

    // Emotional regulation for intense emotions
    if (this.hasIntenseEmotion(userMessage)) {
      techniques.push('emotion_regulation', 'mindfulness');
    }

    // Exploratory techniques for unclear situations
    if (this.needsExploration(userMessage)) {
      techniques.push('exploratory_questioning', 'reflection');
    }

    return techniques.length > 0 ? techniques : ['active_listening', 'validation'];
  }

  generateTherapeuticIntervention(technique: string, userMessage: string): string {
    const interventions = {
      'cognitive_restructuring': this.generateCognitiveReframe(userMessage),
      'exploratory_questioning': this.generateExploratoryQuestion(userMessage),
      'behavioral_activation': this.generateBehavioralSuggestion(userMessage),
      'emotion_regulation': this.generateEmotionRegulationTechnique(userMessage),
      'mindfulness': this.generateMindfulnessIntervention(userMessage)
    };

    return interventions[technique] || this.generateActiveListening(userMessage);
  }

  private hasCognitiveDistortion(message: string): boolean {
    const distortionKeywords = [
      'always', 'never', 'everyone', 'nobody', 'can\'t do anything',
      'terrible', 'awful', 'disaster', 'ruined', 'hopeless'
    ];
    
    return distortionKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private needsBehavioralChange(message: string): boolean {
    const behaviorKeywords = [
      'stuck', 'don\'t know what to do', 'should I', 'how do I',
      'action', 'change', 'different', 'try'
    ];
    
    return behaviorKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private hasIntenseEmotion(message: string): boolean {
    const intensityKeywords = [
      'overwhelming', 'intense', 'can\'t handle', 'too much',
      'breaking down', 'falling apart', 'losing it'
    ];
    
    return intensityKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private needsExploration(message: string): boolean {
    const explorationKeywords = [
      'confused', 'not sure', 'don\'t understand', 'mixed feelings',
      'complicated', 'conflicted'
    ];
    
    return explorationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private generateCognitiveReframe(message: string): string {
    return "I notice some really strong language in what you're sharing. Sometimes when we're in difficult situations, our thoughts can become more absolute than the reality actually is. What evidence do you have both for and against this perspective?";
  }

  private generateExploratoryQuestion(message: string): string {
    const questions = [
      "Can you help me understand more about what that experience was like for you?",
      "What do you think might be driving these feelings?",
      "If a good friend came to you with this same situation, what would you tell them?",
      "What would it look like if this situation improved, even just a little bit?"
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }

  private generateBehavioralSuggestion(message: string): string {
    return "It sounds like you're ready to make some changes, which is actually a really positive sign. What's one small step you could take today that might move you in the direction you want to go?";
  }

  private generateEmotionRegulationTechnique(message: string): string {
    return "When emotions feel this intense, sometimes it can help to ground yourself first. One technique that many people find helpful is the 5-4-3-2-1 method: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This can help create some space between you and the intensity of the emotion.";
  }

  private generateMindfulnessIntervention(message: string): string {
    return "Right now, it might help to just pause and take a few deep breaths with me. Sometimes when we're caught up in difficult thoughts or feelings, coming back to the present moment can provide some relief. What do you notice about your breathing right now?";
  }

  private generateActiveListening(message: string): string {
    return "I'm really hearing what you're sharing with me. It takes courage to open up about difficult experiences. What feels most important for you to focus on right now?";
  }

  predictEffectiveness(technique: string, userProfile: any): number {
    // Base effectiveness scores for techniques
    const baseScores = {
      'cognitive_restructuring': 8,
      'behavioral_activation': 7,
      'exploratory_questioning': 9,
      'emotion_regulation': 8,
      'mindfulness': 7,
      'active_listening': 9,
      'validation': 8
    };

    let score = baseScores[technique] || 6;

    // Adjust based on user profile
    if (userProfile?.technique_effectiveness?.[technique]) {
      score = (score + userProfile.technique_effectiveness[technique]) / 2;
    }

    // Adjust based on openness level
    if (userProfile?.openness_level) {
      if (userProfile.openness_level > 7) score += 1;
      if (userProfile.openness_level < 4) score -= 1;
    }

    return Math.max(1, Math.min(10, score));
  }
}
```

### 4. Paradigm Agent - src/lib/agents/paradigm-agent.ts
Create the belief system and identity transformation agent:

```typescript
export class ParadigmAgent {
  
  identifyLimitingBeliefs(userMessage: string, userProfile: any): string[] {
    const beliefPatterns = [
      { pattern: /I'm not (good|smart|worthy|capable) enough/, belief: 'worthiness_conditional' },
      { pattern: /I (always|never) /, belief: 'absolutist_thinking' },
      { pattern: /I (can't|shouldn't) /, belief: 'capability_doubt' },
      { pattern: /People (don't|won't) /, belief: 'social_pessimism' },
      { pattern: /Nothing (works|matters|changes)/, belief: 'helplessness' },
      { pattern: /I (have to|must|should) /, belief: 'perfectionism' }
    ];

    const identifiedBeliefs = [];
    
    beliefPatterns.forEach(({ pattern, belief }) => {
      if (pattern.test(userMessage.toLowerCase())) {
        identifiedBeliefs.push(belief);
      }
    });

    // Check against existing profile beliefs
    if (userProfile?.limiting_beliefs) {
      userProfile.limiting_beliefs.forEach(belief => {
        if (!identifiedBeliefs.includes(belief)) {
          identifiedBeliefs.push(belief);
        }
      });
    }

    return identifiedBeliefs;
  }

  generateReframeOpportunities(limitingBeliefs: string[], userMessage: string): string[] {
    const reframeMap = {
      'worthiness_conditional': [
        'Your worth isn\'t determined by performance or achievement',
        'You have inherent value regardless of outcomes',
        'Growth and learning matter more than being perfect'
      ],
      'absolutist_thinking': [
        'Life exists in nuances, not absolutes',
        'Exceptions often prove there are possibilities we haven\'t considered',
        'What if this is sometimes true, but not always?'
      ],
      'capability_doubt': [
        'What evidence do you have of your past capabilities?',
        'Skills can be developed with practice and patience',
        'What would you attempt if you knew you couldn\'t fail?'
      ],
      'social_pessimism': [
        'People are often more understanding than we anticipate',
        'Your past experiences with some people don\'t define all relationships',
        'What qualities do you appreciate in others? You likely have those too'
      ],
      'helplessness': [
        'Small actions can create meaningful change over time',
        'You\'ve overcome challenges before - what strengths did you use?',
        'What\'s one tiny thing that has improved recently?'
      ],
      'perfectionism': [
        'Good enough is often perfectly fine',
        'Progress matters more than perfection',
        'What would self-compassion look like in this situation?'
      ]
    };

    const reframes = [];
    limitingBeliefs.forEach(belief => {
      const options = reframeMap[belief] || [];
      if (options.length > 0) {
        reframes.push(options[Math.floor(Math.random() * options.length)]);
      }
    });

    return reframes;
  }

  suggestIdentityShifts(userMessage: string, userProfile: any): string[] {
    const currentIdentityMarkers = this.extractIdentityLanguage(userMessage);
    const growthOpportunities = [];

    currentIdentityMarkers.forEach(marker => {
      const shifts = this.mapIdentityGrowth(marker);
      growthOpportunities.push(...shifts);
    });

    // Consider user's goals and values for personalized shifts
    if (userProfile?.goal_progression) {
      Object.keys(userProfile.goal_progression).forEach(goalArea => {
        growthOpportunities.push(`identity_expansion_${goalArea}`);
      });
    }

    return [...new Set(growthOpportunities)]; // Remove duplicates
  }

  private extractIdentityLanguage(message: string): string[] {
    const identityPatterns = [
      { pattern: /I am (a|an) (.+)/, type: 'role_identity' },
      { pattern: /I'm the type of person who (.+)/, type: 'behavioral_identity' },
      { pattern: /I've always been (.+)/, type: 'historical_identity' },
      { pattern: /I'm not (.+)/, type: 'negative_identity' }
    ];

    const markers = [];
    identityPatterns.forEach(({ pattern, type }) => {
      const matches = message.match(pattern);
      if (matches) {
        markers.push(`${type}: ${matches[1] || matches[2]}`);
      }
    });

    return markers;
  }

  private mapIdentityGrowth(identityMarker: string): string[] {
    if (identityMarker.includes('negative_identity')) {
      return ['explore_positive_aspects', 'challenge_fixed_mindset'];
    }
    
    if (identityMarker.includes('historical_identity')) {
      return ['growth_beyond_past', 'identity_evolution'];
    }
    
    if (identityMarker.includes('role_identity')) {
      return ['role_expansion', 'multifaceted_self'];
    }
    
    return ['general_growth_mindset'];
  }

  trackIdentityEvolution(userId: string, shifts: string[], userProfile: any): any {
    const currentEvolution = userProfile?.identity_evolution || [];
    
    const newEvolutionEntry = {
      timestamp: new Date().toISOString(),
      shifts_suggested: shifts,
      context: 'conversation_analysis',
      integration_status: 'suggested'
    };

    return [...currentEvolution, newEvolutionEntry];
  }
}
```

### 5. Memory Agent - src/lib/agents/memory-agent.ts
Create the context management and pattern recognition agent:

```typescript
export class MemoryAgent {
  
  async compressContext(context: any): Promise<{ compressed_context: any; tokens_used: number }> {
    if (!context.messageHistory || context.messageHistory.length === 0) {
      return { compressed_context: {}, tokens_used: 0 };
    }

    // Extract key themes and patterns from conversation history
    const keyThemes = this.extractKeyThemes(context.messageHistory);
    const emotionalPatterns = this.analyzeEmotionalPatterns(context.messageHistory);
    const progressIndicators = this.identifyProgressIndicators(context.messageHistory);
    const relationshipDynamics = this.analyzeRelationshipDynamics(context.messageHistory);

    const compressed = {
      session_summary: {
        key_themes: keyThemes,
        emotional_journey: emotionalPatterns,
        progress_indicators: progressIndicators,
        relationship_patterns: relationshipDynamics,
        total_messages: context.messageHistory.length,
        time_span: this.calculateTimeSpan(context.messageHistory)
      },
      user_insights: {
        communication_style: this.analyzeCommuncationStyle(context.messageHistory),
        recurring_concerns: this.identifyRecurringConcerns(context.messageHistory),
        growth_areas: this.identifyGrowthAreas(context.messageHistory),
        coping_strategies: this.extractCopingStrategies(context.messageHistory)
      },
      therapeutic_notes: {
        effective_approaches: this.identifyEffectiveApproaches(context.messageHistory),
        resistance_patterns: this.identifyResistancePatterns(context.messageHistory),
        breakthrough_moments: this.identifyBreakthroughs(context.messageHistory)
      }
    };

    const tokensUsed = JSON.stringify(compressed).length / 4; // Rough token estimate

    return { compressed_context: compressed, tokens_used: tokensUsed };
  }

  recognizePatterns(userMessage: string, conversationHistory: any[]): string[] {
    const patterns = [];

    // Emotional patterns
    const emotionalPattern = this.detectEmotionalPattern(userMessage, conversationHistory);
    if (emotionalPattern) patterns.push(emotionalPattern);

    // Behavioral patterns
    const behaviorPattern = this.detectBehaviorPattern(userMessage, conversationHistory);
    if (behaviorPattern) patterns.push(behaviorPattern);

    // Timing patterns
    const timingPattern = this.detectTimingPattern(conversationHistory);
    if (timingPattern) patterns.push(timingPattern);

    // Trigger patterns
    const triggerPattern = this.detectTriggerPattern(userMessage, conversationHistory);
    if (triggerPattern) patterns.push(triggerPattern);

    return patterns;
  }

  identifyProgressIndicators(conversationHistory: any[]): string[] {
    const indicators = [];

    // Language evolution
    if (this.hasLanguageEvolution(conversationHistory)) {
      indicators.push('language_becoming_more_positive');
    }

    // Problem-solving improvement
    if (this.hasProblemSolvingGrowth(conversationHistory)) {
      indicators.push('increased_problem_solving_confidence');
    }

    // Self-awareness growth
    if (this.hasSelfAwarenessGrowth(conversationHistory)) {
      indicators.push('developing_self_awareness');
    }

    // Emotional regulation improvement
    if (this.hasEmotionalRegulationImprovement(conversationHistory)) {
      indicators.push('improved_emotional_regulation');
    }

    return indicators;
  }

  connectContextualDots(userMessage: string, compressedContext: any): string[] {
    const connections = [];

    // Connect to past themes
    if (compressedContext.session_summary?.key_themes) {
      compressedContext.session_summary.key_themes.forEach(theme => {
        if (this.messageRelatesTo(userMessage, theme)) {
          connections.push(`relates_to_theme: ${theme}`);
        }
      });
    }

    // Connect to previous progress
    if (compressedContext.session_summary?.progress_indicators) {
      compressedContext.session_summary.progress_indicators.forEach(indicator => {
        if (this.buildsOnProgress(userMessage, indicator)) {
          connections.push(`builds_on_progress: ${indicator}`);
        }
      });
    }

    // Connect to coping strategies
    if (compressedContext.user_insights?.coping_strategies) {
      compressedContext.user_insights.coping_strategies.forEach(strategy => {
        if (this.usesStrategy(userMessage, strategy)) {
          connections.push(`applying_strategy: ${strategy}`);
        }
      });
    }

    return connections;
  }

  private extractKeyThemes(messages: any[]): string[] {
    const themeKeywords = {
      'relationships': ['partner', 'friend', 'family', 'relationship', 'dating', 'marriage'],
      'work_career': ['job', 'work', 'career', 'boss', 'colleague', 'workplace'],
      'self_worth': ['worth', 'value', 'confidence', 'self-esteem', 'identity'],
      'anxiety_stress': ['anxious', 'worried', 'stress', 'overwhelmed', 'panic'],
      'depression_mood': ['sad', 'depressed', 'hopeless', 'empty', 'down'],
      'personal_growth': ['change', 'improve', 'grow', 'develop', 'progress'],
      'life_purpose': ['purpose', 'meaning', 'direction', 'goals', 'future']
    };

    const themes = new Set();
    const messageText = messages.map(m => m.message).join(' ').toLowerCase();

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => messageText.includes(keyword))) {
        themes.add(theme);
      }
    });

    return Array.from(themes);
  }

  private analyzeEmotionalPatterns(messages: any[]): any {
    const emotions = messages.map(m => m.emotional_tone).filter(Boolean);
    
    return {
      dominant_emotions: this.findDominantEmotions(emotions),
      emotional_trajectory: this.calculateEmotionalTrajectory(emotions),
      emotional_volatility: this.calculateEmotionalVolatility(emotions)
    };
  }

  private identifyProgressIndicators(messages: any[]): string[] {
    // Implementation for progress identification
    return [];
  }

  private analyzeRelationshipDynamics(messages: any[]): any {
    // Implementation for relationship analysis
    return {};
  }

  private calculateTimeSpan(messages: any[]): string {
    if (messages.length < 2) return '0 minutes';
    
    const first = new Date(messages[0].timestamp);
    const last = new Date(messages[messages.length - 1].timestamp);
    const diffMinutes = Math.floor((last.getTime() - first.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hours`;
  }

  // Additional helper methods would be implemented here...
  private analyzeCommuncationStyle(messages: any[]): any { return {}; }
  private identifyRecurringConcerns(messages: any[]): string[] { return []; }
  private identifyGrowthAreas(messages: any[]): string[] { return []; }
  private extractCopingStrategies(messages: any[]): string[] { return []; }
  private identifyEffectiveApproaches(messages: any[]): string[] { return []; }
  private identifyResistancePatterns(messages: any[]): string[] { return []; }
  private identifyBreakthroughs(messages: any[]): string[] { return []; }
  private detectEmotionalPattern(message: string, history: any[]): string { return ''; }
  private detectBehaviorPattern(message: string, history: any[]): string { return ''; }
  private detectTimingPattern(history: any[]): string { return ''; }
  private detectTriggerPattern(message: string, history: any[]): string { return ''; }
  private hasLanguageEvolution(history: any[]): boolean { return false; }
  private hasProblemSolvingGrowth(history: any[]): boolean { return false; }
  private hasSelfAwarenessGrowth(history: any[]): boolean { return false; }
  private hasEmotionalRegulationImprovement(history: any[]): boolean { return false; }
  private messageRelatesTo(message: string, theme: string): boolean { return false; }
  private buildsOnProgress(message: string, indicator: string): boolean { return false; }
  private usesStrategy(message: string, strategy: string): boolean { return false; }
  private findDominantEmotions(emotions: string[]): string[] { return []; }
  private calculateEmotionalTrajectory(emotions: string[]): string { return 'stable'; }
  private calculateEmotionalVolatility(emotions: string[]): number { return 0; }
}
```

### 6. Token Counter Utility - src/utils/token-counter.ts
Create token counting and cost calculation utility:

```typescript
export class TokenCounter {
  
  countTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    // More accurate counting would use tiktoken library
    return Math.ceil(text.length / 4);
  }

  calculateCost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
      'text-embedding-ada-002': { input: 0.0001 / 1000, output: 0 }
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    
    // Assume 70% input, 30% output tokens for conversations
    const inputTokens = Math.floor(tokens * 0.7);
    const outputTokens = Math.floor(tokens * 0.3);
    
    return (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
  }

  estimateResponseTokens(inputTokens: number): number {
    // Estimate output tokens based on input
    return Math.min(inputTokens * 0.5, 1500); // Cap at 1500 tokens
  }
}
```

## Validation Requirements
After creating all files:
1. Ensure TypeScript compilation passes with no errors
2. Test AI orchestrator with a sample message
3. Verify all agents work together seamlessly
4. Confirm token counting and cost calculation work
5. Test context compression functionality
6. Validate crisis detection integration

## Success Criteria
- [ ] AI orchestrator successfully generates therapeutic responses
- [ ] All four agents (Companion, Therapist, Paradigm, Memory) integrate smoothly
- [ ] Context compression reduces token usage while maintaining quality
- [ ] Token counting and cost tracking function accurately
- [ ] Crisis detection properly escalates high-risk situations
- [ ] Response quality meets therapeutic standards
- [ ] System maintains cost efficiency (<$0.02 per message) 