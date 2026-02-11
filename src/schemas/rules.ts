import { z } from 'zod';

/**
 * Zod schemas for rule validation
 */

export const FileEventTypeSchema = z.enum(['add', 'change', 'unlink']);

export const AmaraRuleConditionSchema = z.object({
  path_pattern: z.string().min(1, 'Path pattern cannot be empty'),
  content_pattern: z.string().optional(),
  event_type: z.union([FileEventTypeSchema, z.literal('any')]),
  negation: z.boolean().optional(),
});

export const AmaraRuleSchema = z.object({
  id: z.string().uuid(),
  natural_language: z.string().min(1, 'Natural language description is required'),
  predicate: AmaraRuleConditionSchema,
  created_at: z.string().datetime(),
});

export const SupabaseRuleRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  rule_json: z.object({
    id: z.string().uuid(),
    natural_language: z.string(),
    predicate: AmaraRuleConditionSchema,
    created_at: z.string().datetime(),
  }),
  created_at: z.string().datetime(),
});

export const CreateRuleInputSchema = z.object({
  rule: z.string().min(5, 'Rule description must be at least 5 characters'),
  user_id: z.string().optional(),
});

export const RuleEvaluationResultSchema = z.object({
  matched: z.boolean(),
  rule_id: z.string().uuid(),
  file_path: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type FileEventType = z.infer<typeof FileEventTypeSchema>;
export type AmaraRuleCondition = z.infer<typeof AmaraRuleConditionSchema>;
export type AmaraRule = z.infer<typeof AmaraRuleSchema>;
export type SupabaseRuleRow = z.infer<typeof SupabaseRuleRowSchema>;
export type CreateRuleInput = z.infer<typeof CreateRuleInputSchema>;
export type RuleEvaluationResult = z.infer<typeof RuleEvaluationResultSchema>;
