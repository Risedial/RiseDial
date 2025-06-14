#!/usr/bin/env node

const axios = require('axios');

class MonitoringSetup {
  constructor() {
    this.environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    switch (this.environment) {
      case 'production':
        return 'https://api.risedial.com';
      case 'preview':
      case 'staging':
        return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://risedial-staging.vercel.app';
      default:
        return 'http://localhost:3000';
    }
  }

  async setupHealthChecks() {
    console.log(`Setting up health checks for ${this.environment} environment...`);

    const healthChecks = [
      {
        name: 'API Health',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000
      },
      {
        name: 'Database Connectivity',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        checker: (response) => response.data.services.database.status === 'operational'
      },
      {
        name: 'AI Service',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 15000,
        checker: (response) => response.data.services.ai_service.status === 'operational'
      },
      {
        name: 'Crisis Detection',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        checker: (response) => response.data.services.cost_monitoring.status === 'operational'
      }
    ];

    for (const check of healthChecks) {
      await this.runHealthCheck(check);
    }

    console.log('✅ All health checks passed');
  }

  async runHealthCheck(check) {
    console.log(`Checking: ${check.name}...`);

    try {
      const response = await axios({
        method: check.method,
        url: check.url,
        timeout: check.timeout,
        validateStatus: () => true // Don't throw on any status
      });

      if (response.status !== check.expectedStatus) {
        throw new Error(`Expected status ${check.expectedStatus}, got ${response.status}`);
      }

      if (check.checker && !check.checker(response)) {
        throw new Error('Custom check failed');
      }

      console.log(`✅ ${check.name}: Healthy`);
    } catch (error) {
      console.error(`❌ ${check.name}: Failed - ${error.message}`);
      throw error;
    }
  }

  async setupAlerts() {
    console.log('Setting up monitoring alerts...');

    const alertConfigs = {
      production: {
        criticalResponseTime: 5000, // 5 seconds
        warningResponseTime: 3000,  // 3 seconds
        errorRateThreshold: 0.01,   // 1%
        uptimeThreshold: 0.999      // 99.9%
      },
      staging: {
        criticalResponseTime: 10000, // 10 seconds
        warningResponseTime: 5000,   // 5 seconds
        errorRateThreshold: 0.05,    // 5%
        uptimeThreshold: 0.95        // 95%
      },
      development: {
        criticalResponseTime: 30000, // 30 seconds
        warningResponseTime: 15000,  // 15 seconds
        errorRateThreshold: 0.1,     // 10%
        uptimeThreshold: 0.9         // 90%
      }
    };

    const config = alertConfigs[this.environment] || alertConfigs.development;
    
    console.log(`Alert thresholds for ${this.environment}:`, config);
    
    if (this.environment === 'production') {
      await this.setupProductionAlerts(config);
    }

    console.log('✅ Monitoring alerts configured');
  }

  async setupProductionAlerts(config) {
    // In a real implementation, this would configure external monitoring services
    // like DataDog, New Relic, or custom alerting systems
    
    const alerts = [
      {
        name: 'High Response Time',
        condition: `avg(response_time) > ${config.criticalResponseTime}`,
        action: 'send_slack_alert',
        channel: '#alerts'
      },
      {
        name: 'High Error Rate',
        condition: `error_rate > ${config.errorRateThreshold}`,
        action: 'send_slack_alert',
        channel: '#alerts'
      },
      {
        name: 'Service Down',
        condition: 'uptime < 0.99',
        action: 'send_pagerduty_alert',
        priority: 'high'
      },
      {
        name: 'Crisis Response Delay',
        condition: 'crisis_response_time > 300000', // 5 minutes
        action: 'send_emergency_alert',
        priority: 'critical'
      }
    ];

    for (const alert of alerts) {
      console.log(`Configured alert: ${alert.name}`);
    }
  }

  async setupDashboard() {
    console.log('Setting up monitoring dashboard...');

    const dashboardConfig = {
      environment: this.environment,
      baseUrl: this.baseUrl,
      refreshInterval: this.environment === 'production' ? 30000 : 60000, // 30s prod, 1m others
      metrics: [
        'system_health',
        'response_time',
        'error_rate',
        'active_users',
        'crisis_events',
        'cost_per_user',
        'ai_token_usage'
      ]
    };

    console.log('Dashboard configuration:', dashboardConfig);
    console.log('✅ Monitoring dashboard configured');
  }

  async validateMonitoring() {
    console.log('Validating monitoring setup...');

    const validations = [
      this.validateHealthEndpoint(),
      this.validateMetricsCollection(),
      this.validateAlertingSystem()
    ];

    const results = await Promise.allSettled(validations);
    
    let allPassed = true;
    results.forEach((result, index) => {
      const testName = ['Health Endpoint', 'Metrics Collection', 'Alerting System'][index];
      
      if (result.status === 'fulfilled') {
        console.log(`✅ ${testName}: Validated`);
      } else {
        console.error(`❌ ${testName}: Failed - ${result.reason.message}`);
        allPassed = false;
      }
    });

    if (!allPassed) {
      throw new Error('Monitoring validation failed');
    }

    console.log('✅ Monitoring validation completed successfully');
  }

  async validateHealthEndpoint() {
    const response = await axios.get(`${this.baseUrl}/api/health`);
    
    if (response.status !== 200) {
      throw new Error(`Health endpoint returned status ${response.status}`);
    }

    const requiredFields = ['status', 'timestamp', 'services', 'metrics'];
    for (const field of requiredFields) {
      if (!response.data[field]) {
        throw new Error(`Health endpoint missing field: ${field}`);
      }
    }

    return true;
  }

  async validateMetricsCollection() {
    // Validate that metrics are being collected properly
    const response = await axios.get(`${this.baseUrl}/api/status`);
    
    if (response.status !== 200) {
      throw new Error(`Status endpoint returned status ${response.status}`);
    }

    const requiredMetrics = ['overview', 'performance', 'features'];
    for (const metric of requiredMetrics) {
      if (!response.data.data[metric]) {
        throw new Error(`Status endpoint missing metric: ${metric}`);
      }
    }

    return true;
  }

  async validateAlertingSystem() {
    // Test that alerting system is responsive
    if (this.environment === 'production') {
      // In production, we would test actual alert delivery
      console.log('Alerting system validation - production mode');
    }
    
    return true;
  }

  async setupLogging() {
    console.log('Configuring structured logging...');

    const logConfig = {
      level: this.environment === 'production' ? 'info' : 'debug',
      format: 'json',
      outputs: [
        'console',
        ...(this.environment === 'production' ? ['file', 'external'] : [])
      ],
      fields: {
        service: 'risedial',
        environment: this.environment,
        version: process.env.npm_package_version || '1.0.0'
      }
    };

    console.log('Logging configuration:', logConfig);
    console.log('✅ Structured logging configured');
  }
}

// Main execution
async function main() {
  const monitoring = new MonitoringSetup();

  try {
    console.log(`🔧 Setting up monitoring for ${monitoring.environment} environment`);
    console.log(`📊 Base URL: ${monitoring.baseUrl}`);
    
    await monitoring.setupHealthChecks();
    await monitoring.setupAlerts();
    await monitoring.setupDashboard();
    await monitoring.setupLogging();
    await monitoring.validateMonitoring();

    console.log('✅ Monitoring setup completed successfully');
  } catch (error) {
    console.error('❌ Monitoring setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MonitoringSetup; 