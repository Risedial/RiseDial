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

    const identifiedBeliefs: string[] = [];
    
    beliefPatterns.forEach(({ pattern, belief }) => {
      if (pattern.test(userMessage.toLowerCase())) {
        identifiedBeliefs.push(belief);
      }
    });

    // Check against existing profile beliefs
    if (userProfile?.limiting_beliefs) {
      userProfile.limiting_beliefs.forEach((belief: any) => {
        if (!identifiedBeliefs.includes(belief)) {
          identifiedBeliefs.push(belief);
        }
      });
    }

    return identifiedBeliefs;
  }

  generateReframeOpportunities(limitingBeliefs: string[], userMessage: string): string[] {
    const reframeMap: Record<string, string[]> = {
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

    const reframes: string[] = [];
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
    const growthOpportunities: string[] = [];

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

    return Array.from(new Set(growthOpportunities)); // Remove duplicates
  }

  private extractIdentityLanguage(message: string): string[] {
    const identityPatterns = [
      { pattern: /I am (a|an) (.+)/, type: 'role_identity' },
      { pattern: /I'm the type of person who (.+)/, type: 'behavioral_identity' },
      { pattern: /I've always been (.+)/, type: 'historical_identity' },
      { pattern: /I'm not (.+)/, type: 'negative_identity' }
    ];

    const markers: string[] = [];
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