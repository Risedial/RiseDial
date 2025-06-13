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