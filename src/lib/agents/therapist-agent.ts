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
    const interventions: Record<string, string> = {
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
    const baseScores: Record<string, number> = {
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