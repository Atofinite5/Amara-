import { z } from 'zod';
import { FileEventTypeSchema } from './rules';

/**
 * Zod schemas for event validation
 */

export const AmaraEventSchema = z.object({
  id: z.string().uuid(),
  type: FileEventTypeSchema,
  path: z.string().min(1),
  filename: z.string().optional(),
  content: z.string().optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const RawFileEventSchema = z.object({
  type: FileEventTypeSchema,
  path: z.string().min(1),
  timestamp: z.number().optional(),
});

export const SupabaseEventRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  path: z.string().min(1),
  event_type: z.string(),
  matched_rule: z.string(),
  details: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  created_at: z.string().datetime(),
});

export const CloudEventPayloadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  path: z.string().min(1),
  event_type: FileEventTypeSchema,
  matched_rule: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
});

export const EventQueryOptionsSchema = z.object({
  user_id: z.string().optional(),
  event_type: FileEventTypeSchema.optional(),
  path_pattern: z.string().optional(),
  matched_rule: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  sort_by: z.enum(['created_at', 'path', 'event_type']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const ProcessedEventSchema = AmaraEventSchema.extend({
  matched_rule: z
    .object({
      id: z.string().uuid(),
      natural_language: z.string(),
    })
    .optional(),
  notifications_sent: z.boolean(),
  error: z.string().optional(),
});

export type AmaraEvent = z.infer<typeof AmaraEventSchema>;
export type RawFileEvent = z.infer<typeof RawFileEventSchema>;
export type SupabaseEventRow = z.infer<typeof SupabaseEventRowSchema>;
export type CloudEventPayload = z.infer<typeof CloudEventPayloadSchema>;
export type EventQueryOptions = z.infer<typeof EventQueryOptionsSchema>;
export type ProcessedEvent = z.infer<typeof ProcessedEventSchema>;
