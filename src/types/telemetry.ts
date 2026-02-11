/**
 * Telemetry-related TypeScript interfaces for Amara
 */

/**
 * Telemetry statistics for Amara
 */
export interface AmaraTelemetry {
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
 * Supabase database row for telemetry table
 */
export interface SupabaseTelemetryRow {
  /** Primary key - UUID */
  id: string;
  /** User identifier - TEXT */
  user_id: string;
  /** Number of events - INT */
  events_count: number;
  /** Number of rule matches - INT */
  rule_matches: number;
  /** Number of errors - INT */
  error_count: number;
  /** Last update timestamp - TIMESTAMP */
  updated_at: string;
}

/**
 * Telemetry update payload for cloud synchronization
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
  /** When the telemetry was last updated */
  updated_at: string;
}

/**
 * Telemetry snapshot for reporting
 */
export interface TelemetrySnapshot {
  /** Current timestamp */
  timestamp: string;
  /** Total events since daemon start */
  total_events: number;
  /** Total matches since daemon start */
  total_matches: number;
  /** Total errors since daemon start */
  total_errors: number;
  /** Events in the last hour */
  events_last_hour: number;
  /** Matches in the last hour */
  matches_last_hour: number;
  /** Errors in the last hour */
  errors_last_hour: number;
  /** Daemon uptime in seconds */
  uptime_seconds: number;
  /** Currently active rules count */
  active_rules_count: number;
}

/**
 * Telemetry query options
 */
export interface TelemetryQueryOptions {
  /** Filter by user ID */
  user_id?: string;
  /** Start time for the query window */
  start_time?: string;
  /** End time for the query window */
  end_time?: string;
  /** Include hourly breakdown */
  hourly_breakdown?: boolean;
}

/**
 * Aggregated telemetry data
 */
export interface AggregatedTelemetry {
  /** Total events across all users */
  total_events: number;
  /** Total rule matches across all users */
  total_rule_matches: number;
  /** Total errors across all users */
  total_errors: number;
  /** Number of active users */
  active_users: number;
  /** Most used rule patterns */
  top_rule_patterns: Array<{
    pattern: string;
    count: number;
  }>;
  /** Time period of the aggregation */
  period: {
    start: string;
    end: string;
  };
}
