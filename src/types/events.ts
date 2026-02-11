/**
 * Event-related TypeScript interfaces for Amara
 */

export type FileEventType = 'add' | 'change' | 'unlink';

/**
 * Represents a file system event captured by the watcher
 */
export interface AmaraEvent {
  /** Unique identifier for the event */
  id: string;
  /** The type of file system operation */
  type: FileEventType;
  /** The absolute path to the file */
  path: string;
  /** The file name */
  filename?: string;
  /** File content if available (for 'add' and 'change' events) */
  content?: string;
  /** Timestamp when the event occurred */
  timestamp: string;
  /** Additional metadata from the watcher */
  metadata?: Record<string, unknown>;
}

/**
 * Raw file event from the chokidar watcher before processing
 */
export interface RawFileEvent {
  /** The type of file system operation */
  type: FileEventType;
  /** The absolute path to the file */
  path: string;
  /** Event timestamp */
  timestamp?: number;
}

/**
 * Supabase database row for events table
 */
export interface SupabaseEventRow {
  /** Primary key - UUID */
  id: string;
  /** User identifier - TEXT */
  user_id: string;
  /** File path - TEXT */
  path: string;
  /** Type of event - TEXT (add | change | unlink) */
  event_type: string;
  /** Matched rule ID or description - TEXT */
  matched_rule: string;
  /** Additional event details - JSONB */
  details: Record<string, unknown> | unknown[];
  /** Creation timestamp - TIMESTAMP */
  created_at: string;
}

/**
 * Event payload for cloud synchronization
 */
export interface CloudEventPayload {
  /** Unique event identifier */
  id: string;
  /** User who triggered the event */
  user_id: string;
  /** Path to the affected file */
  path: string;
  /** Type of event */
  event_type: FileEventType;
  /** ID of the rule that matched (if any) */
  matched_rule?: string;
  /** Additional details about the event */
  details?: Record<string, unknown>;
  /** When the event occurred */
  created_at: string;
}

/**
 * Event query options for filtering
 */
export interface EventQueryOptions {
  /** Filter by user ID */
  user_id?: string;
  /** Filter by event type */
  event_type?: FileEventType;
  /** Filter by path pattern */
  path_pattern?: string;
  /** Filter by matched rule */
  matched_rule?: string;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort field */
  sort_by?: 'created_at' | 'path' | 'event_type';
  /** Sort order */
  sort_order?: 'asc' | 'desc';
}

/**
 * Processed event with rule match information
 */
export interface ProcessedEvent extends AmaraEvent {
  /** The rule that matched this event (if any) */
  matched_rule?: {
    id: string;
    natural_language: string;
  };
  /** Whether the event triggered any notifications */
  notifications_sent: boolean;
  /** Error message if processing failed */
  error?: string;
}
