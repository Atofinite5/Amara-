/**
 * Cloud synchronization TypeScript interfaces for Amara
 */

import { FileEventType } from './events';
import { AmaraRuleCondition } from './rules';

/**
 * Cloud payload for rule synchronization
 */
export interface CloudRulePayload {
  /** Unique rule identifier */
  id: string;
  /** User who owns the rule */
  user_id: string;
  /** Natural language rule description */
  natural_language: string;
  /** Structured rule predicate */
  predicate: AmaraRuleCondition;
  /** When the rule was created */
  created_at: string;
  /** Rule status (active | inactive) */
  status: 'active' | 'inactive';
  /** Last synchronization timestamp */
  synced_at?: string;
}

/**
 * Cloud payload for event synchronization
 */
export interface CloudEventPayload {
  /** Unique event identifier */
  id: string;
  /** User who triggered the event */
  user_id: string;
  /** Path to the affected file */
  path: string;
  /** Type of file event */
  event_type: FileEventType;
  /** ID of the rule that matched */
  matched_rule: string;
  /** Additional event details */
  details: Record<string, unknown> | unknown[];
  /** When the event occurred */
  created_at: string;
}

/**
 * Cloud payload for telemetry synchronization
 */
export interface CloudTelemetryPayload {
  /** Unique identifier */
  id: string;
  /** User identifier */
  user_id: string;
  /** Number of events processed */
  events_count: number;
  /** Number of rule matches */
  rule_matches: number;
  /** Number of errors encountered */
  error_count: number;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Supabase client configuration
 */
export interface SupabaseConfig {
  /** Supabase project URL */
  url: string;
  /** Supabase anonymous key */
  anon_key: string;
  /** Service role key (server-side only) */
  service_role_key?: string;
  /** Whether to enable real-time subscriptions */
  enable_realtime: boolean;
}

/**
 * Real-time subscription channel
 */
export interface RealtimeChannel {
  /** Channel identifier */
  id: string;
  /** Channel name */
  name: string;
  /** Subscription status */
  status: 'subscribed' | 'unsubscribed' | 'error';
  /** Event types subscribed to */
  event_types: string[];
  /** Callback for incoming events */
  on_event: (payload: unknown) => void;
}

/**
 * Sync operation status
 */
export interface SyncStatus {
  /** Whether sync is currently in progress */
  in_progress: boolean;
  /** Last successful sync timestamp */
  last_synced_at?: string;
  /** Last sync error message */
  last_error?: string;
  /** Number of pending items to sync */
  pending_count: number;
  /** Total items synced */
  total_synced: number;
}

/**
 * Pull sync result
 */
export interface PullSyncResult<T> {
  /** Items that were pulled */
  items: T[];
  /** Number of new items */
  created: number;
  /** Number of updated items */
  updated: number;
  /** Number of deleted items */
  deleted: number;
  /** Sync duration in milliseconds */
  duration_ms: number;
}

/**
 * Push sync result
 */
export interface PushSyncResult {
  /** Number of items successfully pushed */
  pushed: number;
  /** Number of items that failed */
  failed: number;
  /** Items that failed (with reasons) */
  failures: Array<{
    id: string;
    reason: string;
  }>;
  /** Sync duration in milliseconds */
  duration_ms: number;
}

/**
 * Cloud sync configuration
 */
export interface CloudSyncConfig {
  /** Pull interval in seconds */
  pull_interval_seconds: number;
  /** Push interval in seconds */
  push_interval_seconds: number;
  /** Maximum items per batch */
  batch_size: number;
  /** Enable automatic sync */
  auto_sync: boolean;
  /** Conflict resolution strategy */
  conflict_strategy: 'local_wins' | 'cloud_wins' | 'newest_wins';
}

/**
 * Realtime subscription configuration
 */
export interface RealtimeSubscriptionConfig {
  /** Tables to subscribe to */
  tables: string[];
  /** Filter conditions */
  filters?: Record<string, string>[];
  /** Event types to listen for */
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  /** Subscription name */
  name?: string;
}
