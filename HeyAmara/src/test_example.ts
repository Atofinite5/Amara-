import { logger } from './telemetry';
import { storage } from './storage';
import { Rule } from './storage';

async function runTest() {
  logger.info('Running HeyAmara Test...');
  
  // Create a test rule directly (without LLM for simplicity)
  const testRule: Rule = {
    id: 'test-rule-1',
    natural_language: 'Notify when a .txt file is modified and contains ERROR',
    structured_json: JSON.stringify({
      path_pattern: '**/*.txt',
      content_pattern: 'ERROR',
      event_type: 'update',
      negation: false
    }),
    created_at: new Date().toISOString(),
    is_active: 1
  };
  
  // Save the rule
  storage.addRule(testRule);
  logger.info('Test rule added to storage');
  
  logger.info('Test completed. You can now run the daemon with "npm start"');
  logger.info('To test the rule, create a .txt file in the watchers directory with "ERROR" in it');
}

runTest();