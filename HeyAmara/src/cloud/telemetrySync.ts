import { supabase } from './supabaseClient';
import { logger } from '../telemetry';

export class TelemetrySync {
  async pushStats(stats: any) {
    const { error } = await supabase.from('telemetry').insert({
      ...stats,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      logger.error({ error }, 'Failed to push telemetry to Supabase');
    }
  }
}

export const telemetrySync = new TelemetrySync();
