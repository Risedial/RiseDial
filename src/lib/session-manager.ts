import { db } from './database';
import { MessageContext } from '@/types/conversation';

interface SessionData {
  sessionId: string;
  userId: string;
  messageCount: number;
  lastActivity: string;
  context: any;
}

export class SessionManager {
  async buildMessageContext(userId: string): Promise<MessageContext> {
    try {
      // Get or create session
      const session = await this.getOrCreateSession(userId);
      
      // Get recent conversations for context
      const recentMessages = await db.getRecentConversations(userId, 10);
      
      // Get user profile
      const user = await db.getUserByTelegramId(parseInt(userId));
      
      return {
        userId,
        sessionId: session.sessionId,
        messageHistory: recentMessages,
        userProfile: user,
        sessionData: session.context,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error building message context:', error);
      // Return minimal context on error
      return {
        userId,
        sessionId: this.generateSessionId(),
        messageHistory: [],
        userProfile: null,
        sessionData: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  async getOrCreateSession(userId: string): Promise<SessionData> {
    try {
      // Try to get existing session
      const existingSession = await db.getUserSession(userId);
      
      if (existingSession && new Date(existingSession.expires_at) > new Date()) {
        return {
          sessionId: existingSession.id,
          userId: existingSession.user_id,
          messageCount: existingSession.message_count || 0,
          lastActivity: existingSession.last_activity,
          context: existingSession.context_data || {}
        };
      }

      // Create new session
      const sessionId = this.generateSessionId();
      const newSession = await db.updateUserSession(userId, {
        id: sessionId,
        message_count: 0,
        context_data: {},
        session_quality: 5,
        engagement_level: 5
      });

      return {
        sessionId: newSession.id,
        userId: newSession.user_id,
        messageCount: 0,
        lastActivity: newSession.last_activity,
        context: {}
      };
    } catch (error) {
      console.error('Error getting/creating session:', error);
      // Return basic session on error
      return {
        sessionId: this.generateSessionId(),
        userId,
        messageCount: 0,
        lastActivity: new Date().toISOString(),
        context: {}
      };
    }
  }

  async incrementMessageCount(sessionId: string): Promise<void> {
    try {
      // Update session with incremented message count
      const session = await db.getUserSession(sessionId);
      if (session) {
        await db.updateUserSession(session.user_id, {
          message_count: (session.message_count || 0) + 1,
          last_activity: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error incrementing message count:', error);
    }
  }

  async updateSessionContext(sessionId: string, contextUpdate: any): Promise<void> {
    try {
      const session = await db.getUserSession(sessionId);
      if (session) {
        const updatedContext = {
          ...session.context_data,
          ...contextUpdate
        };
        
        await db.updateUserSession(session.user_id, {
          context_data: updatedContext
        });
      }
    } catch (error) {
      console.error('Error updating session context:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sessionManager = new SessionManager(); 