import { NextRequest, NextResponse } from 'next/server';
import { TelegramBot } from '@/lib/telegram-bot';
import { config } from '@/lib/config';

const bot = new TelegramBot();

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretToken !== config.telegram.webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await request.json();
    
    // Process the update
    await bot.processUpdate(update);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint active' });
} 