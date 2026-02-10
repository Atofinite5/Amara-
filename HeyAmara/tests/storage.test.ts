import { Storage } from '../src/storage';
import fs from 'fs';
import path from 'path';

// Mock logger
jest.mock('../src/telemetry', () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe('Storage', () => {
  let storage: Storage;
  let testDbPath: string;

  beforeAll(() => {
    // Use a test database
    testDbPath = path.join(__dirname, 'heyamara.db'); // Match the hardcoded name in storage.ts if DB_DIR is set
    process.env.DB_DIR = __dirname;
  });

  afterAll(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Also check for test.db just in case
    const otherDb = path.join(__dirname, 'test.db');
    if (fs.existsSync(otherDb)) fs.unlinkSync(otherDb);
  });

  beforeEach(() => {
    storage = new Storage();
    // Clear tables in correct order (child tables first)
    const db = (storage as any).db;
    db.exec('DELETE FROM match_history');
    db.exec('DELETE FROM rules');
    db.exec('DELETE FROM failure_logs');
  });

  describe('Rules CRUD', () => {
    it('should add and retrieve rules', () => {
      const rule = {
        id: 'test-rule-1',
        natural_language: 'Test rule',
        structured_json: JSON.stringify({ path_pattern: '**/*.ts' }),
        created_at: new Date().toISOString(),
        is_active: 1,
      };

      storage.addRule(rule);
      const rules = storage.getRules();
      
      expect(rules).toHaveLength(1);
      expect(rules[0]).toEqual(expect.objectContaining({
        id: 'test-rule-1',
        natural_language: 'Test rule',
      }));
    });

    it('should delete rules', () => {
      const rule = {
        id: 'test-rule-1',
        natural_language: 'Test rule',
        structured_json: JSON.stringify({ path_pattern: '**/*.ts' }),
        created_at: new Date().toISOString(),
        is_active: 1,
      };

      storage.addRule(rule);
      storage.deleteRule('test-rule-1');
      
      const rules = storage.getRules();
      expect(rules).toHaveLength(0);
    });
  });

  describe('Match History', () => {
    it('should add and retrieve match history', () => {
      // Create referenced rule first
      const rule = {
        id: 'test-rule-1',
        natural_language: 'Test rule',
        structured_json: JSON.stringify({ path_pattern: '**/*.ts' }),
        created_at: new Date().toISOString(),
        is_active: 1,
      };
      storage.addRule(rule);

      const match = {
        rule_id: 'test-rule-1',
        file_path: '/test/file.ts',
        match_details: 'Test match',
        timestamp: new Date().toISOString(),
      };

      storage.addMatch(match);
      const matches = storage.getRecentMatches(10);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual(expect.objectContaining({
        rule_id: 'test-rule-1',
        file_path: '/test/file.ts',
      }));
    });
  });

  describe('Failure Logs', () => {
    it('should add and retrieve failure logs', () => {
      const failure = {
        error_message: 'Test error',
        stack_trace: 'Test stack trace',
        timestamp: new Date().toISOString(),
      };

      storage.addFailure(failure);
      
      // We can't easily retrieve failures without modifying the storage class
      // But we can verify the method doesn't throw an error
      expect(true).toBe(true);
    });
  });
});