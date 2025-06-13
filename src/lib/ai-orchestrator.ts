import OpenAI from 'openai';
import { config } from './config';
import { DatabaseUtils } from './database';
import { MessageContext, AIResponse, AgentAnalysis, ResponseMetadata } from '@/types/conversation';
import { CompanionAgent } from './agents/companion-agent';
import { TherapistAgent } from './agents/therapist-agent';
import { ParadigmAgent } from './agents/paradigm-agent';
import { MemoryAgent } from './agents/memory-agent';
import { CrisisDetector } from './crisis-detection';
import { CrisisHandler } from './crisis-handler';
import { TokenCounter } from '@/utils/token-counter';

export class AIOrchestrator {
  private openai: OpenAI;
  private companionAgent: CompanionAgent;
  private therapistAgent: TherapistAgent;
  private paradigmAgent: ParadigmAgent;
  private memoryAgent: MemoryAgent;
  private crisisDetector: CrisisDetector;
  private crisisHandler: CrisisHandler;
  private tokenCounter: TokenCounter;
  private db: DatabaseUtils;

  constructor() {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.companionAgent = new CompanionAgent();
    this.therapistAgent = new TherapistAgent();
    this.paradigmAgent = new ParadigmAgent();
    this.memoryAgent = new MemoryAgent();
    this.crisisDetector = new CrisisDetector();
    this.crisisHandler = new CrisisHandler();
    this.tokenCounter = new TokenCounter();
    this.db = new DatabaseUtils();
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
    const crisisResponse = await this.crisisHandler.generateCrisisResponse(userMessage, context, analysis.crisis_risk_level);
    
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
        response_time_ms: crisisResponse.response_metadata?.response_time_ms || 200,
        model_used: 'crisis_protocol',
        processing_stages: [
          { stage: 'safety_check', duration_ms: 200, tokens_used: 500, status: 'success' }
        ]
      }
    };
  }

  private async trackUsage(userId: string, tokens: number, cost: number) {
    try {
      await this.db.trackApiUsage({
        user_id: userId,
        api_provider: 'openai',
        model_used: config.openai.defaultModel,
        tokens_total: tokens,
        cost_usd: cost,
        request_type: 'conversation',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track API usage:', error);
      // Don't throw - conversation should continue even if tracking fails
    }
  }
}

export const aiOrchestrator = new AIOrchestrator(); 