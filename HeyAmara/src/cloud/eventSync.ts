import { supabase } from './supabaseClient';
import { logger } from '../telemetry';

export class EventSync {
  async pushEvent(event: any) {
    const { error } = await supabase.from('events').insert({
      rule_id: event.rule_id,
      file_path: event.file_path,
      details: event.match_details,
      occurred_at: event.timestamp,
    });

    if (error) {
      logger.error({ error }, 'Failed to push event to Supabase');
    }
  }
}

export const eventSync = new EventSync();
