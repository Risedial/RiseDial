/**
 * Basic smoke tests for Risedial application
 * These tests verify that core functionality works without errors
 */

import { describe, test, expect } from '@jest/globals';

describe('Basic Smoke Tests', () => {
  test('environment should be properly configured', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('application should have required modules', async () => {
    // Test that core modules can be imported without errors
    await expect(import('../../src/lib/config')).resolves.toBeDefined();
  });

  test('database utilities should be available', async () => {
    const databaseModule = await import('../../src/lib/database');
    console.log('Database module exports:', Object.keys(databaseModule));
    
    // Try to get the function from default export or named export
    const getDatabaseUtils = databaseModule.getDatabaseUtils;
    const defaultExport = databaseModule.default;
    const DatabaseUtils = databaseModule.DatabaseUtils;
    
    // Check if we have the factory function
    if (typeof getDatabaseUtils === 'function') {
      const dbUtils = getDatabaseUtils();
      expect(dbUtils).toBeDefined();
      expect(typeof dbUtils.testConnection).toBe('function');
    } 
    // Or if we have the class constructor
    else if (typeof DatabaseUtils === 'function') {
      const dbUtils = new DatabaseUtils();
      expect(dbUtils).toBeDefined();
      expect(typeof dbUtils.testConnection).toBe('function');
    }
    // Or if the default export is already an instance
    else if (defaultExport && typeof defaultExport === 'object' && typeof defaultExport.testConnection === 'function') {
      expect(defaultExport).toBeDefined();
      expect(typeof defaultExport.testConnection).toBe('function');
    } else {
      throw new Error('No valid database utilities found in exports');
    }
  });

  test('environment configuration should work', async () => {
    const { getEnvironmentConfig } = await import('../../src/lib/env');
    expect(typeof getEnvironmentConfig).toBe('function');
    
    const config = getEnvironmentConfig();
    expect(config).toBeDefined();
    expect(config.NODE_ENV).toBeDefined();
  });

  test('crisis detection should be importable', async () => {
    await expect(import('../../src/lib/crisis-detection')).resolves.toBeDefined();
  });

  test('AI orchestrator should be importable', async () => {
    await expect(import('../../src/lib/ai-orchestrator')).resolves.toBeDefined();
  });

  test('database connection test should work', async () => {
    const databaseModule = await import('../../src/lib/database');
    const getDatabaseUtils = databaseModule.getDatabaseUtils;
    const defaultExport = databaseModule.default;
    const DatabaseUtils = databaseModule.DatabaseUtils;
    
    let dbUtils;
    
    // Try to get a database utils instance
    if (typeof getDatabaseUtils === 'function') {
      dbUtils = getDatabaseUtils();
    } else if (typeof DatabaseUtils === 'function') {
      dbUtils = new DatabaseUtils();
    } else if (defaultExport && typeof defaultExport === 'object' && typeof defaultExport.testConnection === 'function') {
      dbUtils = defaultExport;
    }
    
    if (dbUtils) {
      // This should not throw an error even if database is not available
      const result = await dbUtils.testConnection();
      expect(typeof result).toBe('boolean');
    } else {
      console.warn('No database utilities available, skipping test');
    }
  });
}); 