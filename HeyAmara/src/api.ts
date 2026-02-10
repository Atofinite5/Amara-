import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './telemetry';
import { storage, Rule } from './storage';
import { ruleEngine } from './ruleEngine';
import { getLogContent } from './telemetry';
import { protect } from './auth/protect';
import { refresh } from './auth/refresh';
import { signAccessToken, signRefreshToken } from './auth/jwt';
import { codeFusion } from './codeFusion';
import { ruleSync } from './cloud/ruleSync';

export class ApiServer {
  private app: express.Application;
  private port: number;
  private getRules: () => Rule[];

  constructor(getRules: () => Rule[]) {
    this.app = express();
    this.port = parseInt(process.env.API_PORT || '4289', 10);
    this.getRules = getRules;
    
    this.app.use(cors({ origin: true, credentials: true }));
    this.app.use(express.json());
    this.app.use(cookieParser());
    
    // Routes
    this.setupRoutes();
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Auth Routes
    this.app.post('/auth/login', async (req, res) => {
      // Mock login - in real app verify credentials
      const { userId } = req.body; 
      if (!userId) return res.status(400).json({ error: 'userId required' });

      const accessToken = signAccessToken(userId);
      const refreshToken = await signRefreshToken(userId);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });

      res.json({ accessToken });
    });

    this.app.post('/auth/refresh', refresh);

    // Protected Routes
    this.app.use('/api', protect);

    // Get all rules
    this.app.get('/api/rules', (req, res) => {
      try {
        const rules = this.getRules();
        res.json({ rules });
      } catch (error) {
        logger.error({ error }, 'Failed to get rules');
        res.status(500).json({ error: 'Failed to get rules' });
      }
    });

    // Add a new rule
    this.app.post('/api/rules', async (req, res) => {
      try {
        const { naturalLanguage } = req.body;
        if (!naturalLanguage) {
          return res.status(400).json({ error: 'naturalLanguage is required' });
        }

        // Parse the rule using LLM
        const parsedRule = await ruleEngine.parse(naturalLanguage);
        
        // Save to storage
        storage.addRule({
          id: parsedRule.id,
          natural_language: parsedRule.natural_language,
          structured_json: JSON.stringify(parsedRule.predicate),
          created_at: parsedRule.created_at,
          is_active: 1
        });

        // Sync to cloud
        await ruleSync.pushRule({
            id: parsedRule.id,
            natural_language: parsedRule.natural_language,
            structured_json: JSON.stringify(parsedRule.predicate),
            created_at: parsedRule.created_at,
            is_active: 1
        });

        res.status(201).json({ rule: parsedRule });
      } catch (error) {
        logger.error({ error }, 'Failed to add rule');
        res.status(500).json({ error: 'Failed to add rule' });
      }
    });

    // Delete a rule
    this.app.delete('/api/rules/:id', (req, res) => {
      try {
        const { id } = req.params;
        storage.deleteRule(id);
        res.json({ success: true });
      } catch (error) {
        logger.error({ error }, 'Failed to delete rule');
        res.status(500).json({ error: 'Failed to delete rule' });
      }
    });

    // Get recent matches
    this.app.get('/api/matches', (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const matches = storage.getRecentMatches(limit);
        res.json({ matches });
      } catch (error) {
        logger.error({ error }, 'Failed to get matches');
        res.status(500).json({ error: 'Failed to get matches' });
      }
    });

    // Get recent logs
    this.app.get('/api/logs', (req, res) => {
      try {
        const lines = parseInt(req.query.lines as string) || 100;
        const logs = getLogContent(lines);
        res.json({ logs });
      } catch (error) {
        logger.error({ error }, 'Failed to get logs');
        res.status(500).json({ error: 'Failed to get logs' });
      }
    });

    // CodeFusion Analysis
    this.app.post('/api/analyze', async (req, res) => {
      try {
        const { filePath } = req.body;
        if (!filePath) return res.status(400).json({ error: 'filePath required' });
        
        const diagnostics = codeFusion.analyzeFile(filePath);
        const fixes = await codeFusion.suggestFix(filePath, diagnostics);
        
        res.json({ diagnostics, fixes });
      } catch (error) {
        logger.error({ error }, 'Analysis failed');
        res.status(500).json({ error: 'Analysis failed' });
      }
    });
  }

  start() {
    this.app.listen(this.port, () => {
      logger.info(`API server listening at http://localhost:${this.port}`);
    });
  }
}
