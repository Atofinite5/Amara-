import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from './telemetry';

const DB_DIR = process.env.DB_DIR || './data';
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'amara.db');

export interface Rule {
  id: string;
  natural_language: string;
  structured_json: string; // JSON string of the rule predicate
  created_at: string;
  is_active: number; // 0 or 1
}

export interface MatchHistory {
  id: number;
  rule_id: string;
  file_path: string;
  match_details: string;
  timestamp: string;
}

export interface FailureLog {
  id: number;
  error_message: string;
  stack_trace: string;
  timestamp: string;
}

export class Storage {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.init();
  }

  private init() {
    logger.info('Initializing database...');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        natural_language TEXT NOT NULL,
        structured_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id TEXT,
        file_path TEXT NOT NULL,
        match_details TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(rule_id) REFERENCES rules(id)
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS failure_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_message TEXT NOT NULL,
        stack_trace TEXT,
        timestamp TEXT NOT NULL
      );
    `);
    logger.info('Database initialized.');
  }

  // Rules CRUD
  addRule(rule: Rule) {
    const stmt = this.db.prepare(`
      INSERT INTO rules (id, natural_language, structured_json, created_at, is_active)
      VALUES (@id, @natural_language, @structured_json, @created_at, @is_active)
    `);
    return stmt.run(rule);
  }

  getRules(): Rule[] {
    return this.db.prepare('SELECT * FROM rules WHERE is_active = 1').all() as Rule[];
  }

  getAllRules(): Rule[] {
    return this.db.prepare('SELECT * FROM rules').all() as Rule[];
  }

  deleteRule(id: string) {
    // Soft delete or hard delete? Requirement says "CRUD", usually implies hard delete or deactivate.
    // I'll do hard delete for now to keep it clean, or update is_active.
    return this.db.prepare('DELETE FROM rules WHERE id = ?').run(id);
  }

  updateRule(id: string, updates: Partial<Rule>) {
    // Simplified update
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const setClause = keys.map(k => `${k} = @${k}`).join(', ');
    const stmt = this.db.prepare(`UPDATE rules SET ${setClause} WHERE id = @id`);
    return stmt.run({ ...updates, id });
  }

  // History
  addMatch(match: Omit<MatchHistory, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT INTO match_history (rule_id, file_path, match_details, timestamp)
      VALUES (@rule_id, @file_path, @match_details, @timestamp)
    `);
    return stmt.run(match);
  }

  getRecentMatches(limit = 50): MatchHistory[] {
    return this.db.prepare('SELECT * FROM match_history ORDER BY timestamp DESC LIMIT ?').all(limit) as MatchHistory[];
  }

  // Failures
  addFailure(failure: Omit<FailureLog, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT INTO failure_logs (error_message, stack_trace, timestamp)
      VALUES (@error_message, @stack_trace, @timestamp)
    `);
    return stmt.run(failure);
  }
}

export const storage = new Storage();
