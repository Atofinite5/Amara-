import { RuleEngine, RulePredicate } from '../src/ruleEngine';
import { Notifier, NotificationPayload } from '../src/notifier';
import { minimatch } from 'minimatch';

// Mock dependencies
jest.mock('../src/telemetry', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('node-notifier', () => ({
  notify: jest.fn(),
}));

describe('Notification System Logic', () => {
  describe('Rule Engine Evaluation (Content)', () => {
    const ruleEngine = new RuleEngine();

    it('should match simple string content', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: 'import axios',
        event_type: 'any',
        negation: false,
      };
      const content = 'import axios from "axios";';
      expect(await ruleEngine.evaluate(content, predicate)).toBe(true);
    });

    it('should fail if string content is missing', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: 'import axios',
        event_type: 'any',
        negation: false,
      };
      const content = 'import fs from "fs";';
      expect(await ruleEngine.evaluate(content, predicate)).toBe(false);
    });

    it('should match regex content', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: '/console\\.(log|error)/',
        event_type: 'any',
        negation: false,
      };
      const content = 'console.error("error");';
      expect(await ruleEngine.evaluate(content, predicate)).toBe(true);
    });

    it('should handle negation correctly (notify if content is MISSING)', async () => {
      const predicate: RulePredicate = {
        path_pattern: '**/*.ts',
        content_pattern: 'Copyright',
        event_type: 'any',
        negation: true, // "Notify if 'Copyright' is NOT present" -> evaluate returns true if missing
      };
      
      const contentWithCopyright = '// Copyright 2024';
      const contentWithoutCopyright = 'const x = 1;';

      // If content has "Copyright", result should be false (don't notify)
      expect(await ruleEngine.evaluate(contentWithCopyright, predicate)).toBe(false);

      // If content misses "Copyright", result should be true (notify)
      expect(await ruleEngine.evaluate(contentWithoutCopyright, predicate)).toBe(true);
    });
  });

  describe('Daemon Matching Logic (Path & Event)', () => {
    // Replicating Daemon's logic for verification
    const checkMatch = (
      event: { type: string; path: string },
      predicate: RulePredicate
    ) => {
      // 1. Check Event Type
      if (predicate.event_type !== 'any' && predicate.event_type !== event.type) {
        return false;
      }
      // 2. Check Path Pattern
      // Assuming relative path calc is correct in daemon, we test minimatch here
      return minimatch(event.path, predicate.path_pattern);
    };

    it('should match correct event type', () => {
      const predicate: RulePredicate = {
        path_pattern: '*',
        event_type: 'create',
        negation: false
      };
      expect(checkMatch({ type: 'create', path: 'test.ts' }, predicate)).toBe(true);
      expect(checkMatch({ type: 'update', path: 'test.ts' }, predicate)).toBe(false);
    });

    it('should match "any" event type', () => {
      const predicate: RulePredicate = {
        path_pattern: '*',
        event_type: 'any',
        negation: false
      };
      expect(checkMatch({ type: 'delete', path: 'test.ts' }, predicate)).toBe(true);
    });

    it('should match glob patterns correctly', () => {
      const predicate: RulePredicate = {
        path_pattern: 'src/**/*.ts',
        event_type: 'any',
        negation: false
      };
      expect(checkMatch({ type: 'create', path: 'src/utils/helper.ts' }, predicate)).toBe(true);
      expect(checkMatch({ type: 'create', path: 'README.md' }, predicate)).toBe(false);
    });
  });

  describe('Notifier Queue & Rate Limit', () => {
    let notifier: Notifier;

    beforeEach(() => {
      jest.useFakeTimers();
      notifier = new Notifier();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should queue notifications and respect rate limit', async () => {
      const payload1: NotificationPayload = { title: 'T1', message: 'M1' };
      const payload2: NotificationPayload = { title: 'T2', message: 'M2' };

      // Spy on console.log (stdout channel)
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      // Trigger 2 notifications immediately
      await notifier.notify(payload1, ['stdout']);
      await notifier.notify(payload2, ['stdout']);

      // Advance time slightly (queue processing interval is 100ms)
      jest.advanceTimersByTime(150);
      
      // Should have processed the first one
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('T1'));

      // Advance time by 500ms (total 650ms) - still under 1000ms rate limit window
      jest.advanceTimersByTime(500);
      expect(logSpy).toHaveBeenCalledTimes(1); // Still 1

      // Advance time past 1000ms window (total 1150ms)
      jest.advanceTimersByTime(500);
      
      // Should have processed the second one now
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('T2'));

      logSpy.mockRestore();
    });
  });
});
