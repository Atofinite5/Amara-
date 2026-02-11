/**
 * TypeScript type exports for Amara
 */

// Re-export all types from individual modules

// Rules types
export type {
  AmaraRule,
  AmaraRuleCondition,
  SupabaseRuleRow,
  CreateRuleInput,
  RuleEvaluationResult,
} from './rules';

// Events types
export type {
  AmaraEvent,
  FileEventType,
  SupabaseEventRow,
  CloudEventPayload,
  EventQueryOptions,
  ProcessedEvent,
  RawFileEvent,
} from './events';

// Telemetry types
export type {
  AmaraTelemetry,
  SupabaseTelemetryRow,
  CloudTelemetryPayload,
  TelemetrySnapshot,
  TelemetryQueryOptions,
  AggregatedTelemetry,
} from './telemetry';

// Cloud types
export type {
  CloudRulePayload,
  SupabaseConfig,
  RealtimeChannel,
  SyncStatus,
  PullSyncResult,
  PushSyncResult,
  CloudSyncConfig,
  RealtimeSubscriptionConfig,
} from './cloud';

// Daemon types
export type {
  DaemonConfig,
  LoadedRule,
  WatchedEvent,
  NotificationPayload,
  EvaluationContext,
  MatchResult,
  DaemonState,
  WatcherConfig,
  StorageConfig,
  ApiServerConfig,
} from './daemon';
