export class CompanionAgent {
  
  generateEmpathyResponse(userMessage: string, emotionalTone: string): string {
    // Core empathy patterns based on emotional tone
    const empathyPatterns: Record<string, string[]> = {
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