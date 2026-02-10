import { llm } from './llm';
import { logger } from './telemetry';
import { v4 as uuidv4 } from 'uuid';

export interface RulePredicate {
  path_pattern: string; // glob pattern
  content_pattern?: string; // regex or keyword
  event_type: 'create' | 'update' | 'delete' | 'move' | 'any';
  negation: boolean;
  confidence_threshold?: number;
}

export interface ParsedRule {
  id: string;
  natural_language: string;
  predicate: RulePredicate;
  created_at: string;
}

const SYSTEM_PROMPT = `
You are a rule parser for a file system daemon. 
Convert natural language rules into structured JSON predicates.
The JSON structure must be:
{
  "path_pattern": "glob pattern (e.g. **/*.ts, src/foo.js)",
  "content_pattern": "string to match in file content (optional, regex supported if wrapped in /.../)",
  "event_type": "create" | "update" | "delete" | "move" | "any",
  "negation": boolean (true if the rule is "do NOT notify" or similar, usually false),
  "confidence_threshold": number (0.0 to 1.0, default 0.8)
}
Return ONLY the JSON object. No markdown, no explanations.
If the rule is about "adding an import", content_pattern should match that import statement.
If the rule is "notify me when...", negation is false.
`;

export class RuleEngine {
  async parse(naturalLanguage: string): Promise<ParsedRule> {
    try {
      logger.info({ naturalLanguage }, 'Parsing rule...');
      const response = await llm.ask(SYSTEM_PROMPT, naturalLanguage);
      
      let jsonStr = response.content.trim();
      // Cleanup if LLM wraps in markdown
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
      }

      const predicate = JSON.parse(jsonStr) as RulePredicate;

      return {
        id: uuidv4(),
        natural_language: naturalLanguage,
        predicate,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({ error, naturalLanguage }, 'Failed to parse rule');
      throw new Error('Rule parsing failed');
    }
  }

  async evaluate(content: string, predicate: RulePredicate): Promise<boolean> {
    // 1. Check content pattern if exists
    if (predicate.content_pattern) {
      // Check if it's a regex
      if (predicate.content_pattern.startsWith('/') && predicate.content_pattern.endsWith('/')) {
        const regexBody = predicate.content_pattern.slice(1, -1);
        const regex = new RegExp(regexBody);
        if (!regex.test(content)) return predicate.negation;
      } else {
        // Simple includes
        if (!content.includes(predicate.content_pattern)) return predicate.negation;
      }
    }

    // If we passed checks (or no content check), it's a match (unless negated)
    return !predicate.negation;
  }
}

export const ruleEngine = new RuleEngine();
