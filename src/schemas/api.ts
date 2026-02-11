import { z } from 'zod';
import { CreateRuleInputSchema } from './rules';

/**
 * Zod schemas for API request/response validation
 */

// Auth schemas
export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
  }),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
});

// Rule API schemas
export const CreateRuleRequestSchema = CreateRuleInputSchema;

export const CreateRuleResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  rule: z.object({
    id: z.string().uuid(),
    natural_language: z.string(),
    created_at: z.string().datetime(),
  }),
});

export const GetRulesResponseSchema = z.object({
  rules: z.array(
    z.object({
      id: z.string().uuid(),
      natural_language: z.string(),
      created_at: z.string().datetime(),
    })
  ),
  total: z.number().int().nonnegative(),
});

export const DeleteRuleResponseSchema = z.object({
  message: z.string(),
  id: z.string().uuid(),
});

// Event API schemas
export const CreateEventRequestSchema = z.object({
  path: z.string().min(1),
  event_type: z.enum(['add', 'change', 'unlink']),
  content: z.string().optional(),
  matched_rule: z.string().uuid().optional(),
});

export const GetEventsResponseSchema = z.object({
  events: z.array(
    z.object({
      id: z.string().uuid(),
      path: z.string(),
      event_type: z.string(),
      created_at: z.string().datetime(),
    })
  ),
  total: z.number().int().nonnegative(),
});

// Telemetry API schemas
export const GetTelemetryResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  events_count: z.number().int().nonnegative(),
  rule_matches: z.number().int().nonnegative(),
  error_count: z.number().int().nonnegative(),
  updated_at: z.string().datetime(),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  statusCode: z.number().int(),
  timestamp: z.string().datetime(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type CreateRuleRequest = z.infer<typeof CreateRuleRequestSchema>;
export type CreateRuleResponse = z.infer<typeof CreateRuleResponseSchema>;
export type GetRulesResponse = z.infer<typeof GetRulesResponseSchema>;
export type DeleteRuleResponse = z.infer<typeof DeleteRuleResponseSchema>;
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type GetEventsResponse = z.infer<typeof GetEventsResponseSchema>;
export type GetTelemetryResponse = z.infer<typeof GetTelemetryResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
