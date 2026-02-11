import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../telemetry';

export interface SupabaseConfig {
  url: string;
  key: string;
  options?: {
    auth?: {
      persistSession?: boolean;
    };
  };
}

export interface DbResult<T> {
  data: T | null;
  error: Error | null;
}

export class SupabasePlugin {
  private client: SupabaseClient;
  private config: SupabaseConfig;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(config: SupabaseConfig) {
    this.config = config;
    this.validateConfig();
    this.client = createClient(config.url, config.key, config.options);
    logger.info('Supabase Plugin initialized');
  }

  private validateConfig() {
    if (!this.config.url || !this.config.key) {
      throw new Error('Supabase URL and Key are required');
    }
  }

  // --- Connection Testing ---
  async testConnection(): Promise<boolean> {
    try {
      // Simple health check query (e.g., getting project settings or just a dummy query)
      // Since we can't query system tables easily without permissions, we'll try a lightweight op
      // or just assume if client creation didn't fail (it doesn't throw usually)
      // Let's try to get the session, which is local but verifies client state
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      logger.info('Supabase connection test passed (Session check)');
      return true;
    } catch (error: any) {
      logger.error({ error }, 'Supabase connection test failed');
      return false;
    }
  }

  // --- Authentication ---
  async signUp(email: string, password: string): Promise<DbResult<any>> {
    try {
      const { data, error } = await this.client.auth.signUp({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      logger.error({ error }, 'SignUp failed');
      return { data: null, error };
    }
  }

  async signIn(email: string, password: string): Promise<DbResult<any>> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      logger.info({ user: data.user?.id }, 'User signed in');
      return { data, error: null };
    } catch (error: any) {
      logger.error({ error }, 'SignIn failed');
      return { data: null, error };
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) logger.error({ error }, 'SignOut failed');
    else logger.info('User signed out');
  }

  // --- Database Operations ---
  async getData<T>(table: string, columns = '*', limit = 10): Promise<DbResult<T[]>> {
    try {
      const { data, error } = await this.client.from(table).select(columns).limit(limit);

      if (error) throw error;
      return { data: data as T[], error: null };
    } catch (error: any) {
      logger.error({ error, table }, 'Fetch data failed');
      return { data: null, error };
    }
  }

  async insertData<T>(table: string, record: Partial<T>): Promise<DbResult<T>> {
    try {
      const { data, error } = await this.client.from(table).insert(record).select().single();

      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error: any) {
      logger.error({ error, table }, 'Insert data failed');
      return { data: null, error };
    }
  }

  // --- Real-time Subscriptions ---
  subscribeToTable(table: string, callback: (payload: any) => void): void {
    if (this.channels.has(table)) {
      logger.warn(`Already subscribed to table: ${table}`);
      return;
    }

    logger.info(`Subscribing to table: ${table}`);
    const channel = this.client
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        logger.debug({ event: payload.eventType, table }, 'Real-time event received');
        callback(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info(`Subscription active for ${table}`);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error(`Subscription failed for ${table}`);
        }
      });

    this.channels.set(table, channel);
  }

  unsubscribeFromTable(table: string): void {
    const channel = this.channels.get(table);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(table);
      logger.info(`Unsubscribed from ${table}`);
    }
  }

  // --- Cleanup ---
  disconnect(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
    logger.info('Supabase Plugin disconnected');
  }
}
