#!/usr/bin/env ts-node

import * as https from 'https';
import * as crypto from 'crypto';

interface WebhookSetupResult {
  success: boolean;
  message: string;
  url?: string;
}

class TelegramWebhookSetup {
  private botToken: string;
  private webhookUrl: string;
  private secretToken?: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.webhookUrl = this.getWebhookUrl();
    this.secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || this.generateSecretToken();
  }

  private getWebhookUrl(): string {
    const vercelUrl = process.env.VERCEL_URL;
    const baseUrl = vercelUrl ? `https://${vercelUrl}` : 'https://your-app.vercel.app';
    return `${baseUrl}/api/telegram-webhook`;
  }

  private generateSecretToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async makeRequest(url: string, method: string = 'GET', data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const postData = data ? JSON.stringify(data) : undefined;

      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error}`));
          }
        });
      });

      req.on('error', reject);
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }

  private async getCurrentWebhookInfo(): Promise<any> {
    const url = `https://api.telegram.org/bot${this.botToken}/getWebhookInfo`;
    return this.makeRequest(url);
  }

  private async setWebhook(): Promise<WebhookSetupResult> {
    const url = `https://api.telegram.org/bot${this.botToken}/setWebhook`;
    const data = {
      url: this.webhookUrl,
      secret_token: this.secretToken,
      max_connections: 100,
      allowed_updates: ['message', 'callback_query']
    };

    try {
      const response = await this.makeRequest(url, 'POST', data);
      
      if (response.ok) {
        return {
          success: true,
          message: 'Webhook set successfully',
          url: this.webhookUrl
        };
      } else {
        return {
          success: false,
          message: `Failed to set webhook: ${response.description}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error setting webhook: ${error}`
      };
    }
  }

  private async deleteWebhook(): Promise<WebhookSetupResult> {
    const url = `https://api.telegram.org/bot${this.botToken}/deleteWebhook`;
    
    try {
      const response = await this.makeRequest(url, 'POST');
      
      if (response.ok) {
        return {
          success: true,
          message: 'Webhook deleted successfully'
        };
      } else {
        return {
          success: false,
          message: `Failed to delete webhook: ${response.description}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error deleting webhook: ${error}`
      };
    }
  }

  public async setup(): Promise<boolean> {
    console.log('🔧 Setting up Telegram webhook...\n');

    // Validate required environment variables
    if (!this.botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
      return false;
    }

    if (!this.botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      console.error('❌ TELEGRAM_BOT_TOKEN format is invalid');
      return false;
    }

    // Get current webhook info
    try {
      console.log('🔍 Checking current webhook status...');
      const currentInfo = await this.getCurrentWebhookInfo();
      
      if (currentInfo.ok) {
        const info = currentInfo.result;
        console.log(`Current webhook URL: ${info.url || 'None'}`);
        console.log(`Pending updates: ${info.pending_update_count || 0}`);
        
        if (info.url === this.webhookUrl) {
          console.log('✅ Webhook is already set to the correct URL');
          return true;
        }
      } else {
        console.error(`❌ Failed to get webhook info: ${currentInfo.description}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error checking webhook status: ${error}`);
      return false;
    }

    // Set new webhook
    console.log(`🔗 Setting webhook to: ${this.webhookUrl}`);
    const result = await this.setWebhook();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`📝 Webhook URL: ${result.url}`);
      console.log(`🔐 Secret token: ${this.secretToken}`);
      
      // Show environment variable reminder
      console.log('\n💡 Environment Variables:');
      console.log('='.repeat(50));
      console.log(`TELEGRAM_BOT_TOKEN=${this.botToken}`);
      console.log(`TELEGRAM_WEBHOOK_SECRET=${this.secretToken}`);
      console.log(`VERCEL_URL=${process.env.VERCEL_URL || 'your-app.vercel.app'}`);
      
      return true;
    } else {
      console.error(`❌ ${result.message}`);
      return false;
    }
  }

  public async reset(): Promise<boolean> {
    console.log('🔄 Resetting Telegram webhook...\n');

    // Delete current webhook
    const deleteResult = await this.deleteWebhook();
    
    if (deleteResult.success) {
      console.log(`✅ ${deleteResult.message}`);
      
      // Set new webhook
      const setupResult = await this.setWebhook();
      
      if (setupResult.success) {
        console.log(`✅ ${setupResult.message}`);
        console.log(`📝 New webhook URL: ${setupResult.url}`);
        return true;
      } else {
        console.error(`❌ ${setupResult.message}`);
        return false;
      }
    } else {
      console.error(`❌ ${deleteResult.message}`);
      return false;
    }
  }

  public async status(): Promise<void> {
    console.log('📊 Telegram webhook status:\n');

    try {
      const info = await this.getCurrentWebhookInfo();
      
      if (info.ok) {
        const result = info.result;
        console.log(`🔗 URL: ${result.url || 'None'}`);
        console.log(`📊 Pending updates: ${result.pending_update_count || 0}`);
        console.log(`⏰ Last error date: ${result.last_error_date ? new Date(result.last_error_date * 1000).toISOString() : 'None'}`);
        console.log(`❌ Last error message: ${result.last_error_message || 'None'}`);
        console.log(`✅ Max connections: ${result.max_connections || 'Default'}`);
        console.log(`📝 Allowed updates: ${result.allowed_updates?.join(', ') || 'All'}`);
      } else {
        console.error(`❌ Failed to get webhook info: ${info.description}`);
      }
    } catch (error) {
      console.error(`❌ Error getting webhook status: ${error}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const webhook = new TelegramWebhookSetup();
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      webhook.setup().then(success => process.exit(success ? 0 : 1));
      break;
    case 'reset':
      webhook.reset().then(success => process.exit(success ? 0 : 1));
      break;
    case 'status':
      webhook.status().then(() => process.exit(0));
      break;
    default:
      console.log('Usage: ts-node setup-webhook.ts [setup|reset|status]');
      console.log('  setup  - Set up webhook for current deployment');
      console.log('  reset  - Delete and recreate webhook');
      console.log('  status - Show current webhook status');
      process.exit(1);
  }
}

export { TelegramWebhookSetup }; 