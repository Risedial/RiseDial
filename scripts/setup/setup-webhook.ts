import { telegramBot } from '@/lib/telegram-bot';
import { config } from '@/lib/config';

async function setupTelegramWebhook() {
  const webhookUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/telegram-webhook`
    : process.env.WEBHOOK_URL || 'https://your-domain.vercel.app/api/telegram-webhook';

  console.log('Setting up Telegram webhook...');
  console.log('Webhook URL:', webhookUrl);

  try {
    const success = await telegramBot.setupWebhook(webhookUrl);
    
    if (success) {
      console.log('✅ Webhook setup successful!');
      
      const webhookInfo = await telegramBot.getWebhookInfo();
      console.log('Webhook info:', webhookInfo);
      
      // Validate webhook configuration
      console.log('\n📋 Webhook Configuration:');
      console.log(`URL: ${webhookInfo.url}`);
      console.log(`Pending Updates: ${webhookInfo.pending_update_count}`);
      console.log(`Last Error Date: ${webhookInfo.last_error_date || 'None'}`);
      console.log(`Last Error Message: ${webhookInfo.last_error_message || 'None'}`);
      console.log(`Max Connections: ${webhookInfo.max_connections}`);
      console.log(`Allowed Updates: ${webhookInfo.allowed_updates?.join(', ') || 'All'}`);
      
    } else {
      console.error('❌ Webhook setup failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error setting up webhook:', error);
    process.exit(1);
  }
}

// Validate environment variables before setup
function validateEnvironment() {
  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'WEBHOOK_SECRET_TOKEN'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease set these variables and try again.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

// Main execution
async function main() {
  console.log('🚀 Risedial Telegram Webhook Setup\n');
  
  try {
    validateEnvironment();
    await setupTelegramWebhook();
    
    console.log('\n🎉 Webhook setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the webhook by sending a message to your bot');
    console.log('2. Monitor the webhook status in your Telegram bot settings');
    console.log('3. Check your application logs for incoming webhook requests');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { setupTelegramWebhook }; 