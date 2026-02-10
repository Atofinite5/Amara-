import { supabase } from './supabaseClient';
import { storage } from '../storage';
import { logger } from '../telemetry';

export class RuleSync {
  async start() {
    // 1. Initial Pull
    await this.pullRules();

    // 2. Realtime Subscription
    supabase
      .channel('rules-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rules' },
        (payload) => {
          logger.info({ payload }, 'Rule change detected from cloud');
          this.handleRuleChange(payload);
        }
      )
      .subscribe();
  }

  async pullRules() {
    const { data, error } = await supabase.from('rules').select('*');
    if (error) {
      logger.error({ error }, 'Failed to pull rules from Supabase');
      return;
    }

    if (data) {
      for (const remoteRule of data) {
        // Upsert to local storage
        storage.addRule({
          id: remoteRule.id,
          natural_language: remoteRule.natural_language,
          structured_json: JSON.stringify(remoteRule.predicate), // Assuming structure matches
          created_at: remoteRule.created_at,
          is_active: remoteRule.is_active ? 1 : 0,
        });
      }
      logger.info({ count: data.length }, 'Synced rules from cloud');
    }
  }

  async pushRule(rule: any) {
    const { error } = await supabase.from('rules').upsert({
      id: rule.id,
      natural_language: rule.natural_language,
      predicate: JSON.parse(rule.structured_json),
      is_active: rule.is_active === 1,
    });

    if (error) {
      logger.error({ error }, 'Failed to push rule to Supabase');
    }
  }

  private handleRuleChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      storage.addRule({
        id: newRecord.id,
        natural_language: newRecord.natural_language,
        structured_json: JSON.stringify(newRecord.predicate),
        created_at: newRecord.created_at,
        is_active: newRecord.is_active ? 1 : 0,
      });
    } else if (eventType === 'DELETE') {
      storage.deleteRule(oldRecord.id);
    }
  }
}

export const ruleSync = new RuleSync();
