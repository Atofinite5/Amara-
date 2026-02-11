/**
 * Daemon-related TypeScript interfaces for Amara
 */

import { FileEventType } from './events';
import { AmaraRuleCondition } from './rules';

/**
 * Daemon configuration options
 */
export interface DaemonConfig {
  /** Port for the API server */
  port: number;
  /** Path to watch (defaults to current directory) */
  watch_path: string;
  /** Path to the database directory */
  db_dir: string;
  /** Path to the logs directory */
  log_dir: string;
  /** Redis connection URL */
  redis_url?: string;
  /** Whether to enable cloud sync */
  cloud_sync_enabled: boolean;
  /** Cloud sync configuration */
  cloud_config?: {
    supabase_url: string;
    supabase_key: string;
  };
  /** Notification channels to enable */
  notification_channels: ('stdout' | 'system' | 'webhook')[];
  /** LLM provider to use */
  llm_provider: 'mock' | 'openai' | 'anthropic';
  /** Log level */
  log_level: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * In-memory loaded rule structure
 */
export interface LoadedRule {
  /** Unique rule identifier */
  id: string;
  /** Natural language description */
  natural_language: string;
  /** Parsed predicate for matching */
  predicate: AmaraRuleCondition;
  /** Whether the rule is currently active */
  is_active: boolean;
  /** When the rule was created */
  created_at: string;
  /** How many times this rule has matched */
  match_count: number;
  /** User who owns this rule */
  user_id: string;
}

/**
 * File event being watched
 */
export interface WatchedEvent {
  /** Type of file system operation */
  type: FileEventType;
  /** Absolute path to the file */
  path: string;
  /** Relative path from watch directory */
  relative_path: string;
  /** File content if available */
  content?: string;
  /** Event timestamp */
  timestamp: Date;
  /** Size of the file in bytes */
  size?: number;
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Rule ID that triggered this notification */
  rule_id?: string;
  /** File path that triggered this notification */
  file_path?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Rule evaluation context
 */
export interface EvaluationContext {
  /** The event being evaluated */
  event: WatchedEvent;
  /** All currently loaded rules */
  rules: LoadedRule[];
  /** Current working directory */
  cwd: string;
}

/**
 * Match result from rule evaluation
 */
export interface MatchResult {
  /** The rule that matched */
  rule: LoadedRule;
  /** The event that matched */
  event: WatchedEvent;
  /** When the match occurred */
  matched_at: string;
  /** Additional match details */
  details?: Record<string, unknown>;
}

/**
 * Daemon runtime state
 */
export interface DaemonState {
  /** Whether the daemon is currently running */
  is_running: boolean;
  /** Daemon process ID */
  pid: number;
  /** When the daemon started */
  started_at: string;
  /** Number of rules currently loaded */
  rules_count: number;
  /** Number of events processed */
  events_processed: number;
  /** Number of matches found */
  matches_count: number;
  /** Number of errors encountered */
  errors_count: number;
  /** Last event timestamp */
  last_event_at?: string;
  /** Last match timestamp */
  last_match_at?: string;
}

/**
 * Watcher configuration
 */
export interface WatcherConfig {
  /** Paths to watch */
  paths: string[];
  /** File patterns to ignore */
  ignore_patterns: string[];
  /** Whether to watch recursively */
  recursive: boolean;
  /** Whether to ignore hidden files */
  ignore_hidden: boolean;
  /** Event types to listen for */
  event_types: FileEventType[];
  /** Polling interval in milliseconds (use 0 for native watchers) */
  polling_interval: number;
}

/**
 * Storage initialization options
 */
export interface StorageConfig {
  /** Database file path */
  db_path: string;
  /** Enable WAL mode */
  enable_wal: boolean;
  /** Cache size in bytes */
  cache_size: number;
}

/**
 * API server configuration
 */
export interface ApiServerConfig {
  /** Server port */
  port: number;
  /** CORS origin */
  cors_origin: string;
  /** Rate limit window in seconds */
  rate_limit_window: number;
  /** Maximum requests per window */
  rate_limit_max: number;
  /** JWT secret for token signing */
  jwt_secret: string;
  /** Token expiry in seconds */
  token_expiry: number;
}
