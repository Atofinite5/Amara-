import { supabase } from './supabaseClient';
import { storage } from '../storage';
import { logger } from '../telemetry';

export class RuleSyncService {
  async pullRules() {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*');

      if (error) throw error;

      if (data) {
        logger.info({ count: data.length }, 'Pulled rules from Supabase');
        // Merge logic: For now, we might just overwrite or add missing
        data.forEach((remoteRule: any) => {
          // Assume remoteRule matches Rule interface
          storage.addRule({
            id: remoteRule.id,
            natural_language: remoteRule.natural_language,
            structured_json: JSON.stringify(remoteRule.structured_json || {}),
            created_at: remoteRule.created_at,
            is_active: remoteRule.is_active ? 1 : 0
          });
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to pull rules from Supabase');
    }
  }

  async pushRule(rule: any) {
    try {
      const { error } = await supabase
        .from('rules')
        .upsert({
          id: rule.id,
          natural_language: rule.natural_language,
          structured_json: JSON.parse(rule.structured_json),
          is_active: !!rule.is_active,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      logger.info({ ruleId: rule.id }, 'Pushed rule to Supabase');
    } catch (error) {
      logger.error({ error }, 'Failed to push rule to Supabase');
    }
  }

  startRealtimeSync() {
    supabase
      .channel('public:rules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rules' }, payload => {
        logger.info({ event: payload.eventType }, 'Realtime rule update received');
        this.pullRules(); // Refresh all for simplicity
      })
      .subscribe();
  }
}

export const ruleSync = new RuleSyncService();
