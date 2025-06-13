import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { config } from './config';

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database utilities
export class DatabaseUtils {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = supabase;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('users')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    const { data, error } = await this.client
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByTelegramId(telegramId: number) {
    const { data, error } = await this.client
      .from('users')
      .select(`
        *,
        user_psychological_profiles(*)
      `)
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async saveConversation(conversationData: Database['public']['Tables']['conversations']['Insert']) {
    const { data, error } = await this.client
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createCrisisEvent(crisisData: Database['public']['Tables']['crisis_events']['Insert']) {
    const { data, error } = await this.client
      .from('crisis_events')
      .insert(crisisData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePsychologicalProfile(
    userId: string, 
    profileData: Database['public']['Tables']['user_psychological_profiles']['Update']
  ) {
    const { data, error } = await this.client
      .from('user_psychological_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async trackApiUsage(usageData: Database['public']['Tables']['api_usage']['Insert']) {
    const { error } = await this.client
      .from('api_usage')
      .insert(usageData);

    if (error) throw error;
  }

  async getDailyCost(userId: string, date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await this.client
      .rpc('get_daily_cost', {
        user_uuid: userId,
        target_date: date
      });

    if (error) throw error;
    return data || 0;
  }

  async getRecentConversations(userId: string, limit = 10) {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async cleanExpiredSessions() {
    const { data, error } = await this.client
      .rpc('clean_expired_sessions');

    if (error) throw error;
    return data || 0;
  }

  async updateUserActivity(userId: string) {
    const { error } = await this.client
      .from('users')
      .update({
        last_message_date: new Date().toISOString().split('T')[0],
        daily_message_count: 1, // Will be handled by database trigger
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async getUserSession(userId: string) {
    const { data, error } = await this.client
      .from('active_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUserSession(
    userId: string, 
    sessionData: Database['public']['Tables']['active_sessions']['Update']
  ) {
    const { data, error } = await this.client
      .from('active_sessions')
      .upsert({
        user_id: userId,
        ...sessionData,
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveProgressMetric(metricData: Database['public']['Tables']['progress_metrics']['Insert']) {
    const { data, error } = await this.client
      .from('progress_metrics')
      .insert(metricData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserProgressMetrics(userId: string, metricType?: string, limit = 50) {
    let query = this.client
      .from('progress_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(limit);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async saveFeedback(feedbackData: Database['public']['Tables']['user_feedback']['Insert']) {
    const { data, error } = await this.client
      .from('user_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSystemConfig(key: string, environment = 'all') {
    const { data, error } = await this.client
      .from('system_config')
      .select('value')
      .eq('key', key)
      .in('environment', [environment, 'all'])
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.value;
  }

  async updateSystemConfig(
    key: string, 
    value: Record<string, any>, 
    description?: string,
    environment = 'all'
  ) {
    const { data, error } = await this.client
      .from('system_config')
      .upsert({
        key,
        value,
        description,
        environment,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCrisisEvents(userId?: string, resolved?: boolean, limit = 50) {
    let query = this.client
      .from('crisis_events')
      .select(`
        *,
        users(id, first_name, telegram_id)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async resolveCrisisEvent(eventId: string, resolutionNotes: string) {
    const { data, error } = await this.client
      .from('crisis_events')
      .update({
        resolved: true,
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getApiUsageStats(userId?: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = this.client
      .from('api_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getTotalCosts(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from('api_usage')
      .select('cost_usd')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;
    
    const totalCost = (data || []).reduce((sum, row) => sum + (row.cost_usd || 0), 0);
    return totalCost;
  }

  async getUserStats() {
    const { count: totalUsers, error: usersError } = await this.client
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers, error: activeError } = await this.client
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_message_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (usersError || activeError) {
      throw usersError || activeError;
    }

    return {
      total: totalUsers || 0,
      active_last_7_days: activeUsers || 0
    };
  }
}

export const db = new DatabaseUtils(); 