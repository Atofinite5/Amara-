import { supabase } from './supabaseClient';
import { logger } from '../telemetry';

export class TelemetrySyncService {
  async syncStats(stats: any) {
    try {
      const { error } = await supabase.from('telemetry').insert({
        ...stats,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      logger.error({ error }, 'Failed to sync telemetry to Supabase');
    }
  }
}

export const telemetrySync = new TelemetrySyncService();
