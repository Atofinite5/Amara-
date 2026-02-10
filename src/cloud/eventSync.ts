import { supabase } from './supabaseClient';
import { logger } from '../telemetry';

export class EventSyncService {
  async pushEvent(event: any) {
    try {
      const { error } = await supabase
        .from('events')
        .insert({
            rule_id: event.rule_id,
            file_path: event.file_path,
            details: event.match_details,
            timestamp: event.timestamp
        });

      if (error) throw error;
    } catch (error) {
      logger.error({ error }, 'Failed to sync event to Supabase');
    }
  }
}

export const eventSync = new EventSyncService();
