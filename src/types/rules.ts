/**
 * Rule-related TypeScript interfaces for Amara
 */

export type FileEventType = 'add' | 'change' | 'unlink';

/**
 * Represents the parsed condition structure within a rule
 */
export interface AmaraRuleCondition {
  /** Glob pattern to match file paths */
  path_pattern: string;
  /** Regex or string pattern to match file content */
  content_pattern?: string;
  /** Type of file event to match */
  event_type: FileEventType | 'any';
  /** Negation flag - match when condition is NOT met */
  negation?: boolean;
}

/**
 * Represents a fully parsed Amara rule
 */
export interface AmaraRule {
  /** Unique identifier for the rule */
  id: string;
  /** Natural language description of the rule */
  natural_language: string;
  /** Structured predicate for rule evaluation */
  predicate: AmaraRuleCondition;
  /** Timestamp when rule was created */
  created_at: string;
}

/**
 * Supabase database row for rules table
 */
export interface SupabaseRuleRow {
  /** Primary key - UUID */
  id: string;
  /** User identifier - TEXT */
  user_id: string;
  /** JSONB column containing the rule data */
  rule_json: {
    /** Unique identifier for the rule */
    id: string;
    /** Natural language description of the rule */
    natural_language: string;
    /** Structured predicate for rule evaluation */
    predicate: AmaraRuleCondition;
    /** Timestamp when rule was created */
    created_at: string;
  };
  /** Creation timestamp - TIMESTAMP */
  created_at: string;
}

/**
 * Input for creating a new rule
 */
export interface CreateRuleInput {
  /** Natural language rule description */
  rule: string;
  /** Optional user ID override */
  user_id?: string;
}

/**
 * Rule evaluation result
 */
export interface RuleEvaluationResult {
  /** Whether the rule matched */
  matched: boolean;
  /** The rule that was evaluated */
  rule_id: string;
  /** The file path that was matched */
  file_path: string;
  /** Additional match details */
  details?: Record<string, unknown>;
}
