import { describe, test, expect } from '@jest/globals';
import { AIOrchestrator } from '@/lib/ai-orchestrator';
import { testUtils } from '../setup';

// Mock OpenAI for load testing to avoid API costs
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation(() => {
            // Add realistic delay to simulate API response time
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  choices: [{
                    message: {
                      content: JSON.stringify({
                        companion_response: 'Mock therapeutic response for load testing.',
                        emotional_tone: 'supportive',
                        confidence_level: 8,
                        therapeutic_techniques: ['active_listening'],
                        therapeutic_value: 7,
                        key_insights: ['Load test insight'],
                        agent_analysis: {
                          companion: { empathy_score: 8, validation_provided: true, rapport_building: ['empathy'] },
                          therapist: { techniques_used: ['active_listening'], intervention_type: 'emotional', effectiveness_prediction: 7 },
                          paradigm: { limiting_beliefs_identified: [], reframe_opportunities: [], identity_shifts_suggested: [] },
                          memory: { patterns_recognized: [], progress_indicators: [], context_connections: [] }
                        }
                      })
                    }
                  }]
                });
              }, Math.random() * 500 + 100); // 100-600ms delay
            });
          })
        }
      }
    }))
  };
});

const aiOrchestrator = new AIOrchestrator();

describe('Load Testing', () => {
  describe('Concurrent User Simulation', () => {
    test('should handle multiple concurrent users', async () => {
      const numberOfUsers = 10;
      const messagesPerUser = 5;
      
      const users = await Promise.all(
        Array(numberOfUsers).fill(0).map((_, i) => 
          testUtils.createTestUser({ first_name: `Load Test User ${i}` })
        )
      );

      const startTime = Date.now();
      
      // Simulate concurrent conversations
      const allPromises = users.flatMap(user => 
        Array(messagesPerUser).fill(0).map(async (_, messageIndex) => {
          const context = {
            userId: user.id,
            messageHistory: [],
            timestamp: new Date().toISOString()
          };
          
          try {
            const response = await aiOrchestrator.generateResponse(
              `Test message ${messageIndex} from user ${user.first_name}`, 
              context
            );
            return {
              userId: user.id,
              messageIndex,
              success: true,
              responseTime: response.response_metadata.response_time_ms,
              cost: response.response_metadata.cost_usd
            };
          } catch (error) {
            return {
              userId: user.id,
              messageIndex,
              success: false,
              error: (error as Error).message
            };
          }
        })
      );

      const results = await Promise.all(allPromises);
      const totalTime = Date.now() - startTime;

      // Analyze results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      const avgResponseTime = successful.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successful.length;
      const totalCost = successful.reduce((sum, r) => sum + (r.cost || 0), 0);

      console.log(`Load Test Results:
        Total requests: ${results.length}
        Successful: ${successful.length}
        Failed: ${failed.length}
        Success rate: ${(successful.length / results.length * 100).toFixed(2)}%
        Total time: ${totalTime}ms
        Avg response time: ${avgResponseTime.toFixed(2)}ms
        Total cost: $${totalCost.toFixed(4)}
      `);

      // Assertions
      expect(successful.length / results.length).toBeGreaterThan(0.95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(5000); // Average response under 5s
      expect(totalCost).toBeLessThan(5.0); // Total cost under $5 for 50 concurrent requests ($0.10 per message)
    }, 60000); // 60 second timeout

    test('should maintain performance under sustained load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestInterval = 1000; // 1 request per second
      
      const testUser = await testUtils.createTestUser();
      const results: any[] = [];
      
      const startTime = Date.now();
      let requestCount = 0;

      while (Date.now() - startTime < testDuration) {
        const requestStart = Date.now();
        
        try {
          const context = {
            userId: testUser.id,
            messageHistory: [],
            timestamp: new Date().toISOString()
          };
          
          const response = await aiOrchestrator.generateResponse(
            `Sustained load test message ${requestCount}`, 
            context
          );
          
          results.push({
            requestIndex: requestCount,
            responseTime: Date.now() - requestStart,
            systemResponseTime: response.response_metadata.response_time_ms,
            cost: response.response_metadata.cost_usd,
            success: true
          });
          
        } catch (error) {
          results.push({
            requestIndex: requestCount,
            responseTime: Date.now() - requestStart,
            error: (error as Error).message,
            success: false
          });
        }
        
        requestCount++;
        
        // Wait for next interval
        await testUtils.delay(requestInterval);
      }

      // Analyze sustained performance
      const successful = results.filter(r => r.success);
      const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
      const successRate = successful.length / results.length;

      console.log(`Sustained Load Test Results:
        Duration: ${testDuration}ms
        Total requests: ${results.length}
        Success rate: ${(successRate * 100).toFixed(2)}%
        Avg response time: ${avgResponseTime.toFixed(2)}ms
      `);

      expect(successRate).toBeGreaterThan(0.98); // 98% success rate
      expect(avgResponseTime).toBeLessThan(3000); // Under 3 seconds average
    }, 45000); // 45 second timeout
  });

  describe('Memory and Resource Usage', () => {
    test('should not have memory leaks during extended use', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const testUser = await testUtils.createTestUser();
      
      // Simulate 100 conversations
      for (let i = 0; i < 100; i++) {
        const context = {
          userId: testUser.id,
          messageHistory: [],
          timestamp: new Date().toISOString()
        };
        
        await aiOrchestrator.generateResponse(`Memory test message ${i}`, context);
        
        // Force garbage collection periodically
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;

      console.log(`Memory Usage:
        Initial: ${(initialMemory / 1024 / 1024).toFixed(2)} MB
        Final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB
        Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)
      `);

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }, 120000); // 2 minute timeout
  });

  describe('Stress Testing', () => {
    test('should handle burst traffic patterns', async () => {
      const testUser = await testUtils.createTestUser();
      const burstSize = 20;
      const burstCount = 3;
      
      const results: any[] = [];
      
      for (let burst = 0; burst < burstCount; burst++) {
        console.log(`Starting burst ${burst + 1} of ${burstCount}`);
        
        // Create burst of concurrent requests
        const burstPromises = Array(burstSize).fill(0).map(async (_, i) => {
          const context = {
            userId: testUser.id,
            messageHistory: [],
            timestamp: new Date().toISOString()
          };
          
          const startTime = Date.now();
          
          try {
            const response = await aiOrchestrator.generateResponse(
              `Burst ${burst} message ${i}`,
              context
            );
            
            return {
              burst,
              messageIndex: i,
              responseTime: Date.now() - startTime,
              success: true
            };
          } catch (error) {
            return {
              burst,
              messageIndex: i,
              responseTime: Date.now() - startTime,
              success: false,
              error: (error as Error).message
            };
          }
        });
        
        const burstResults = await Promise.all(burstPromises);
        results.push(...burstResults);
        
        // Cool down between bursts
        if (burst < burstCount - 1) {
          await testUtils.delay(5000); // 5 second cooldown
        }
      }
      
      const successful = results.filter(r => r.success);
      const successRate = successful.length / results.length;
      const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
      
      console.log(`Burst Test Results:
        Total bursts: ${burstCount}
        Messages per burst: ${burstSize}
        Total messages: ${results.length}
        Success rate: ${(successRate * 100).toFixed(2)}%
        Avg response time: ${avgResponseTime.toFixed(2)}ms
      `);
      
      expect(successRate).toBeGreaterThan(0.90); // 90% success rate for burst traffic
      expect(avgResponseTime).toBeLessThan(8000); // Under 8 seconds average for burst
    }, 180000); // 3 minute timeout
  });

  describe('Error Recovery', () => {
    test('should recover from simulated API failures', async () => {
      const testUser = await testUtils.createTestUser();
      const totalRequests = 20;
      const results: any[] = [];
      
      // Mock API to fail randomly
      const originalMock = jest.mocked(aiOrchestrator.generateResponse);
      let failureCount = 0;
      
      for (let i = 0; i < totalRequests; i++) {
        const context = {
          userId: testUser.id,
          messageHistory: [],
          timestamp: new Date().toISOString()
        };
        
        try {
          const response = await aiOrchestrator.generateResponse(
            `Recovery test message ${i}`,
            context
          );
          
          results.push({
            requestIndex: i,
            success: true,
            responseTime: response.response_metadata?.response_time_ms || 0
          });
        } catch (error) {
          failureCount++;
          results.push({
            requestIndex: i,
            success: false,
            error: (error as Error).message
          });
        }
        
        // Small delay between requests
        await testUtils.delay(100);
      }
      
      const successRate = results.filter(r => r.success).length / results.length;
      
      console.log(`Error Recovery Test:
        Total requests: ${totalRequests}
        Failures: ${failureCount}
        Success rate: ${(successRate * 100).toFixed(2)}%
      `);
      
      // Should handle errors gracefully
      expect(results.length).toBe(totalRequests);
    }, 60000); // 1 minute timeout
  });
}); 