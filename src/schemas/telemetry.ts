import { z } from 'zod';

/**
 * Zod schemas for telemetry validation
 */

export const AmaraTelemetrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  events_count: z.number().int().nonnegative(),
  rule_matches: z.number().int().nonnegative(),
  error_count: z.number().int().nonnegative(),
  updated_at: z.string().datetime(),
});

export const SupabaseTelemetryRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  events_count: z.number().int().nonnegative(),
  rule_matches: z.number().int().nonnegative(),
  error_count: z.number().int().nonnegative(),
  updated_at: z.string().datetime(),
});

export const CloudTelemetryPayloadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  events_count: z.number().int().nonnegative(),
  rule_matches: z.number().int().nonnegative(),
  error_count: z.number().int().nonnegative(),
  updated_at: z.string().datetime(),
});

export const TelemetrySnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  total_events: z.number().int().nonnegative(),
  total_matches: z.number().int().nonnegative(),
  total_errors: z.number().int().nonnegative(),
  events_last_hour: z.number().int().nonnegative(),
  matches_last_hour: z.number().int().nonnegative(),
  errors_last_hour: z.number().int().nonnegative(),
  uptime_seconds: z.number().nonnegative(),
  active_rules_count: z.number().int().nonnegative(),
});

export const TelemetryQueryOptionsSchema = z.object({
  user_id: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  hourly_breakdown: z.boolean().optional(),
});

export const AggregatedTelemetrySchema = z.object({
  total_events: z.number().int().nonnegative(),
  total_rule_matches: z.number().int().nonnegative(),
  total_errors: z.number().int().nonnegative(),
  active_users: z.number().int().nonnegative(),
  top_rule_patterns: z.array(
    z.object({
      pattern: z.string(),
      count: z.number().int().positive(),
    })
  ),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
});

export type AmaraTelemetry = z.infer<typeof AmaraTelemetrySchema>;
export type SupabaseTelemetryRow = z.infer<typeof SupabaseTelemetryRowSchema>;
export type CloudTelemetryPayload = z.infer<typeof CloudTelemetryPayloadSchema>;
export type TelemetrySnapshot = z.infer<typeof TelemetrySnapshotSchema>;
export type TelemetryQueryOptions = z.infer<typeof TelemetryQueryOptionsSchema>;
export type AggregatedTelemetry = z.infer<typeof AggregatedTelemetrySchema>;
