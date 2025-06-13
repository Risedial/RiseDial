import { NextRequest, NextResponse } from 'next/server';
import { Bot, webhookCallback } from 'grammy';
import { createHash, timingSafeEqual } from 'crypto';

// Initialize the bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

// Set up bot handlers
bot.command('start', (ctx) => {
  return ctx.reply('Hello! I am your Risedial mental health assistant. How can I help you today?');
});

bot.on('message:text', async (ctx) => {
  // For now, just echo the message
  // In a real implementation, this would integrate with your AI logic
  return ctx.reply(`I received your message: "${ctx.message.text}". I'm here to help with your mental health needs.`);
});

// Create webhook callback
const handleUpdate = webhookCallback(bot, 'std/http');

function verifyTelegramWebhook(request: NextRequest): boolean {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secretToken) {
    console.warn('No webhook secret configured');
    return true; // Allow if no secret is set
  }

  const receivedToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!receivedToken) {
    return false;
  }

  const expectedToken = Buffer.from(secretToken);
  const receivedTokenBuffer = Buffer.from(receivedToken);

  return expectedToken.length === receivedTokenBuffer.length &&
         timingSafeEqual(expectedToken, receivedTokenBuffer);
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    if (!verifyTelegramWebhook(request)) {
      console.error('Webhook verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the update from Telegram
    const update = await request.json();
    
    // Process the update using grammy
    const response = await handleUpdate(update);
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers
    });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  const botInfo = await bot.api.getMe().catch(() => null);
  
  return NextResponse.json({ 
    status: 'Telegram webhook endpoint active',
    bot: botInfo ? {
      username: botInfo.username,
      first_name: botInfo.first_name
    } : null,
    timestamp: new Date().toISOString()
  });
} 