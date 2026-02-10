import { RuleEngine, RulePredicate } from '../src/ruleEngine';

// Mock logger
jest.mock('../src/telemetry', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
  });

  describe('evaluate', () => {
    it('should match simple string content', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: 'import axios',
        event_type: 'update',
        negation: false,
      };
      const content = 'import axios from "axios";';
      expect(await ruleEngine.evaluate(content, predicate)).toBe(true);
    });

    it('should fail if string content is missing', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: 'import axios',
        event_type: 'update',
        negation: false,
      };
      const content = 'import fs from "fs";';
      expect(await ruleEngine.evaluate(content, predicate)).toBe(false);
    });

    it('should match regex content', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: '/console\\.(log|error)/',
        event_type: 'update',
        negation: false,
      };
      const content = 'console.error("error");';
      expect(await ruleEngine.evaluate(content, predicate)).toBe(true);
    });

    it('should handle negation correctly', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: 'Copyright',
        event_type: 'update',
        negation: true,
      };
      
      const contentWithCopyright = '// Copyright 2024';
      const contentWithoutCopyright = 'const x = 1;';
      
      // If content has "Copyright", result should be false (don't notify)
      expect(await ruleEngine.evaluate(contentWithCopyright, predicate)).toBe(false);
      
      // If content misses "Copyright", result should be true (notify)
      expect(await ruleEngine.evaluate(contentWithoutCopyright, predicate)).toBe(true);
    });

    it('should handle rules without content pattern', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        event_type: 'update',
        negation: false,
      };
      
      // Should match regardless of content when no content_pattern is specified
      expect(await ruleEngine.evaluate('any content', predicate)).toBe(true);
    });
  });
});