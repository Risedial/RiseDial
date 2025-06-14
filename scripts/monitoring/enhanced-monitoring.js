#!/usr/bin/env node

const axios = require('axios');

class EnhancedMonitoring {
  constructor() {
    this.duration = this.parseDuration(process.argv.find(arg => arg.startsWith('--duration='))?.split('=')[1] || '1h');
    this.environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    this.baseUrl = this.getBaseUrl();
    this.interval = 30000; // 30 seconds
    this.isRunning = false;
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

  parseDuration(duration) {
    const match = duration.match(/^(\d+)([hm])$/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 3600000;
    }
  }

  async start() {
    console.log(`🔍 Starting enhanced monitoring for ${this.environment} environment`);
    console.log(`📊 Base URL: ${this.baseUrl}`);
    console.log(`⏱️ Duration: ${this.duration / 1000 / 60} minutes`);
    console.log(`🔄 Check interval: ${this.interval / 1000} seconds`);

    this.isRunning = true;
    const startTime = Date.now();
    const endTime = startTime + this.duration;

    // Initial health check
    await this.performHealthCheck();

    // Start monitoring loop
    const monitoringLoop = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(monitoringLoop);
        await this.stop();
        return;
      }

      await this.performHealthCheck();
    }, this.interval);

    // Setup graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n📋 Enhanced monitoring interrupted');
      clearInterval(monitoringLoop);
      this.stop();
    });

    console.log('✅ Enhanced monitoring started successfully');
  }

  async performHealthCheck() {
    try {
      const startTime = Date.now();
      
      // Perform comprehensive health check
      const healthResponse = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 15000
      });

      const responseTime = Date.now() - startTime;

      // Check response validity
      if (healthResponse.status !== 200) {
        await this.handleError('Health Check Failed', `HTTP ${healthResponse.status}`, responseTime);
        return;
      }

      // Validate response structure
      const healthData = healthResponse.data;
      if (!healthData.status || !healthData.services) {
        await this.handleError('Invalid Health Response', 'Missing required fields', responseTime);
        return;
      }

      // Check individual services
      await this.validateServices(healthData.services, responseTime);

      // Log successful check
      console.log(`✅ Health check passed - Response time: ${responseTime}ms`);

      // Check for performance issues
      if (responseTime > 5000) {
        await this.handleWarning('Slow Response Time', `${responseTime}ms response time detected`);
      }

    } catch (error) {
      await this.handleError('Health Check Error', error.message);
    }
  }

  async validateServices(services, responseTime) {
    const criticalServices = ['database', 'ai_service'];
    
    for (const serviceName of criticalServices) {
      const service = services[serviceName];
      
      if (!service) {
        await this.handleError('Missing Service', `Service ${serviceName} not found in health response`);
        continue;
      }

      if (service.status !== 'operational') {
        await this.handleError('Service Down', `${serviceName} status: ${service.status}`);
      }
    }
  }

  async handleError(type, message, responseTime = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `❌ [${timestamp}] ${type}: ${message}`;
    
    if (responseTime) {
      console.log(`${logMessage} (Response time: ${responseTime}ms)`);
    } else {
      console.log(logMessage);
    }

    // Send alert for critical errors
    await this.sendAlert({
      type: 'error',
      title: type,
      message,
      environment: this.environment,
      timestamp,
      responseTime
    });
  }

  async handleWarning(type, message) {
    const timestamp = new Date().toISOString();
    console.log(`⚠️ [${timestamp}] WARNING - ${type}: ${message}`);

    // Send warning alert
    await this.sendAlert({
      type: 'warning',
      title: type,
      message,
      environment: this.environment,
      timestamp
    });
  }

  async sendAlert(alertData) {
    if (!process.env.SLACK_WEBHOOK) {
      return;
    }

    const color = alertData.type === 'error' ? '#ff0000' : '#ffaa00';
    const emoji = alertData.type === 'error' ? ':rotating_light:' : ':warning:';

    const slackMessage = {
      channel: '#alerts',
      username: 'Enhanced Monitoring',
      icon_emoji: emoji,
      attachments: [{
        color,
        title: `${alertData.title} - ${alertData.environment}`,
        text: alertData.message,
        timestamp: Math.floor(new Date(alertData.timestamp).getTime() / 1000),
        fields: [
          {
            title: 'Environment',
            value: alertData.environment,
            short: true
          },
          {
            title: 'Time',
            value: alertData.timestamp,
            short: true
          }
        ]
      }]
    };

    if (alertData.responseTime) {
      slackMessage.attachments[0].fields.push({
        title: 'Response Time',
        value: `${alertData.responseTime}ms`,
        short: true
      });
    }

    try {
      await axios.post(process.env.SLACK_WEBHOOK, slackMessage);
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  async stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('\n📋 Enhanced monitoring completed');
    
    // Send completion notification
    await this.sendCompletionNotification();
    
    console.log('✅ Enhanced monitoring session ended');
    process.exit(0);
  }

  async sendCompletionNotification() {
    if (!process.env.SLACK_WEBHOOK) {
      return;
    }

    const message = {
      channel: '#deployments',
      username: 'Enhanced Monitoring',
      icon_emoji: ':white_check_mark:',
      text: `Enhanced monitoring session completed for ${this.environment} environment.`,
      attachments: [{
        color: '#00ff00',
        title: 'Monitoring Session Complete',
        text: `Enhanced monitoring for ${this.environment} has finished successfully.`,
        timestamp: Math.floor(Date.now() / 1000)
      }]
    };

    try {
      await axios.post(process.env.SLACK_WEBHOOK, message);
    } catch (error) {
      console.error('Failed to send completion notification:', error.message);
    }
  }
}

// Main execution
async function main() {
  const monitor = new EnhancedMonitoring();
  await monitor.start();
}

if (require.main === module) {
  main();
}

module.exports = EnhancedMonitoring; 