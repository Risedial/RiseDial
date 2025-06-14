const axios = require('axios');

describe('Smoke Tests', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const timeout = 30000;

  beforeAll(() => {
    console.log(`Running smoke tests against: ${baseUrl}`);
  });

  test('Health endpoint should be accessible', async () => {
    const response = await axios.get(`${baseUrl}/api/health`, { timeout });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('timestamp');
    expect(response.data).toHaveProperty('services');
  }, timeout);

  test('Status endpoint should be accessible', async () => {
    const response = await axios.get(`${baseUrl}/api/status`, { timeout });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
    expect(response.data).toHaveProperty('data');
  }, timeout);

  test('Application should serve pages', async () => {
    const response = await axios.get(`${baseUrl}/health`, { timeout });
    
    expect(response.status).toBe(200);
  }, timeout);

  test('Telegram webhook endpoint should exist', async () => {
    // Test that the endpoint exists (even if it returns an error for invalid requests)
    try {
      await axios.post(`${baseUrl}/api/telegram-webhook`, {}, { timeout });
    } catch (error) {
      // We expect this to fail with 400/401, but not 404
      expect(error.response.status).not.toBe(404);
    }
  }, timeout);

  test('API should handle CORS properly', async () => {
    const response = await axios.options(`${baseUrl}/api/health`, { timeout });
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  }, timeout);
}); 