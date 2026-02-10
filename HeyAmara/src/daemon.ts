import cluster from 'cluster';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { logger } from './telemetry';
import { watcher, FileEvent } from './watcher';
import { storage, Rule } from './storage';
import { ruleEngine, RulePredicate } from './ruleEngine';
import { notifierService } from './notifier';
import { ApiServer } from './api';
import { minimatch } from 'minimatch';
import { redisClient } from './redisClient';
import { ruleSync } from './cloud/ruleSync';
import { eventSync } from './cloud/eventSync';
import { telemetrySync } from './cloud/telemetrySync';

const PID_FILE = path.join(process.cwd(), 'heyamara.pid');

if (cluster.isPrimary) {
  // Master Process: Manages lifecycle and crash respawn
  logger.info(`Master ${process.pid} is running`);

  // Write PID file
  fs.writeFileSync(PID_FILE, process.pid.toString());

  // Fork workers
  cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Respawning...`);
    // Add delay to prevent rapid loops if crash is immediate
    setTimeout(() => {
      cluster.fork();
    }, 1000);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    logger.info('Master shutting down...');
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

} else {
  // Worker Process: Runs the actual daemon logic
  logger.info(`Worker ${process.pid} started`);

  class Daemon {
    private rules: Rule[] = [];
    private api: ApiServer;

    constructor() {
      this.api = new ApiServer(() => storage.getRules());
    }

    async start() {
      try {
        // Init Redis
        await redisClient.connect();

        // Start Cloud Sync
        await ruleSync.start();

        // Load rules (from local storage, synced via ruleSync)
        this.loadRules();

        // Start API
        this.api.start();

        // Start Watcher
        watcher.start();
        watcher.on('event', (event: FileEvent) => this.handleEvent(event));

        logger.info('Daemon started successfully');
      } catch (error) {
        logger.fatal({ error }, 'Daemon failed to start');
        process.exit(1);
      }
    }

    loadRules() {
      this.rules = storage.getRules();
      logger.info({ count: this.rules.length }, 'Rules loaded');
      
      // Cache rules in Redis
      this.rules.forEach(rule => {
        redisClient.cacheRule(rule.id, rule);
      });
    }

    async handleEvent(event: FileEvent) {
      logger.debug({ event }, 'Processing file event');
      
      // Cache event in Redis
      await redisClient.cacheEvent(event);

      for (const rule of this.rules) {
        try {
          const predicate: RulePredicate = JSON.parse(rule.structured_json);

          // 1. Check Event Type
          if (predicate.event_type !== 'any' && predicate.event_type !== event.type) {
            continue;
          }

          // 2. Check Path Pattern
          const relPath = path.relative(process.cwd(), event.path);
          if (!minimatch(relPath, predicate.path_pattern)) {
            continue;
          }

          // 3. Check Content
          if (event.content && predicate.content_pattern) {
             const match = await ruleEngine.evaluate(event.content, predicate);
             if (!match) continue;
          } else if (predicate.content_pattern && !event.content) {
             continue; 
          }

          // Match!
          logger.info({ ruleId: rule.id, file: relPath }, 'Rule matched!');
          
          // Record history
          storage.addMatch({
            rule_id: rule.id,
            file_path: event.path,
            match_details: `Matched rule: ${rule.natural_language}`,
            timestamp: new Date().toISOString()
          });

          // Sync event to cloud
          eventSync.pushEvent({
            rule_id: rule.id,
            file_path: event.path,
            match_details: `Matched rule: ${rule.natural_language}`,
            timestamp: new Date().toISOString()
          });

          // Sync telemetry
          telemetrySync.pushStats({
             event: 'rule_match',
             rule_id: rule.id
          });

          // Notify
          notifierService.notify({
            title: 'HeyAmara Alert',
            message: `Rule triggered: ${rule.natural_language}\nFile: ${relPath}`,
            rule_id: rule.id,
            file_path: event.path
          });

        } catch (error: any) {
          logger.error({ error, ruleId: rule.id }, 'Error evaluating rule');
          storage.addFailure({
            error_message: error.message,
            stack_trace: error.stack,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  const daemon = new Daemon();
  daemon.start();
}
