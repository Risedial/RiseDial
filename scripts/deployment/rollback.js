#!/usr/bin/env node

const axios = require('axios');
const { execSync } = require('child_process');

class RollbackManager {
  constructor() {
    this.environment = process.argv.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.vercelOrgId = process.env.VERCEL_ORG_ID;
    this.vercelProjectId = process.env.VERCEL_PROJECT_ID;
  }

  async performRollback() {
    console.log(`🚨 Starting emergency rollback for ${this.environment} environment`);

    try {
      // 1. Get previous deployment
      const previousDeployment = await this.getPreviousDeployment();
      
      // 2. Promote previous deployment
      await this.promoteDeployment(previousDeployment.uid);
      
      // 3. Verify rollback
      await this.verifyRollback();
      
      // 4. Notify stakeholders
      await this.notifyRollbackComplete(previousDeployment);

      console.log('✅ Emergency rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      await this.notifyRollbackFailure(error);
      process.exit(1);
    }
  }

  async getPreviousDeployment() {
    console.log('📋 Finding previous stable deployment...');

    const response = await axios.get(
      `https://api.vercel.com/v6/deployments?projectId=${this.vercelProjectId}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const deployments = response.data.deployments.filter(dep => 
      dep.state === 'READY' && 
      dep.target === (this.environment === 'production' ? 'production' : 'preview')
    );

    if (deployments.length < 2) {
      throw new Error('No previous deployment found for rollback');
    }

    // Return the second deployment (first is current, second is previous)
    const previousDeployment = deployments[1];
    console.log(`Found previous deployment: ${previousDeployment.uid} (${new Date(previousDeployment.createdAt).toISOString()})`);
    
    return previousDeployment;
  }

  async promoteDeployment(deploymentId) {
    console.log(`🔄 Promoting deployment ${deploymentId} to ${this.environment}...`);

    if (this.environment === 'production') {
      const response = await axios.patch(
        `https://api.vercel.com/v13/deployments/${deploymentId}/promote`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.vercelToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to promote deployment: ${response.statusText}`);
      }
    }

    console.log('✅ Deployment promoted successfully');
  }

  async verifyRollback() {
    console.log('🔍 Verifying rollback...');

    const baseUrl = this.environment === 'production' 
      ? 'https://api.risedial.com'
      : 'https://risedial-staging.vercel.app';

    // Wait for deployment to be live
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${baseUrl}/api/health`, { timeout: 10000 });
        
        if (response.status === 200) {
          console.log('✅ Rollback verification successful');
          return;
        }
      } catch (error) {
        console.log(`Verification attempt ${attempts + 1}/${maxAttempts} failed, retrying...`);
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }

    throw new Error('Rollback verification failed - service not responding');
  }

  async notifyRollbackComplete(deployment) {
    const message = `🔄 ROLLBACK COMPLETED
    
Environment: ${this.environment}
Rolled back to: ${deployment.uid}
Deployed at: ${new Date(deployment.createdAt).toISOString()}
Status: ✅ Service restored

The system has been rolled back to the previous stable deployment.
Please investigate the cause of the failure and prepare a fix.`;

    await this.sendSlackNotification(message, '#alerts');
  }

  async notifyRollbackFailure(error) {
    const message = `🚨 ROLLBACK FAILED
    
Environment: ${this.environment}
Error: ${error.message}
Status: ❌ Manual intervention required

URGENT: Automatic rollback has failed!
Manual recovery procedures must be initiated immediately.

@oncall @engineering-leads`;

    await this.sendSlackNotification(message, '#alerts');
  }

  async sendSlackNotification(message, channel) {
    if (!process.env.SLACK_WEBHOOK) {
      console.log('No Slack webhook configured, skipping notification');
      return;
    }

    try {
      await axios.post(process.env.SLACK_WEBHOOK, {
        channel,
        text: message,
        username: 'Risedial Deployment Bot',
        icon_emoji: ':warning:'
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error.message);
    }
  }
}

// Main execution
async function main() {
  const rollbackManager = new RollbackManager();
  await rollbackManager.performRollback();
}

if (require.main === module) {
  main();
}

module.exports = RollbackManager; 