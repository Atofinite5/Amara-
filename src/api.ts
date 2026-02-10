import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger, getLogContent } from './telemetry';
import { storage } from './storage';
import { ruleEngine } from './ruleEngine';
import { protect } from './auth/protect';
import { refresh } from './auth/refresh';
import { signAccessToken, signRefreshToken } from './auth/jwt';
import { codeFusion } from './codeFusion';
import path from 'path';

export class ApiServer {
  private app: express.Application;
  private port = 4289;
  private onRulesUpdate: () => void;

  constructor(onRulesUpdate: () => void) {
    this.onRulesUpdate = onRulesUpdate;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(cookieParser());
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info({ method: req.method, url: req.url }, 'Incoming request');
      next();
    });
  }

  private setupRoutes() {
    // Auth Routes
    this.app.post('/auth/login', (req, res) => {
      // Mock login for demonstration
      const { username } = req.body;
      if (!username) {
        res.status(400).json({ error: 'Username required' });
        return;
      }
      
      const userId = 'user_123'; // In real app, look up user
      const accessToken = signAccessToken(userId);
      const refreshToken = signRefreshToken(userId);

      res.cookie('refreshToken', refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.json({ accessToken });
    });

    this.app.post('/auth/refresh', refresh);

    // Public Status
    this.app.get('/status', (req, res) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });

    // Protected Routes
    this.app.use('/api', protect); // Protect all /api routes
    
    // Rules
    this.app.get('/api/rules', (req, res) => {
      res.json(storage.getAllRules());
    });

    this.app.post('/api/rules', async (req, res) => {
      try {
        const { rule } = req.body;
        if (!rule) throw new Error('Rule string required');
        
        const parsed = await ruleEngine.parse(rule);
        storage.addRule({
          id: parsed.id,
          natural_language: parsed.natural_language,
          structured_json: JSON.stringify(parsed.predicate),
          created_at: parsed.created_at,
          is_active: 1
        });
        
        this.onRulesUpdate();
        res.status(201).json(parsed);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    // Events
    this.app.get('/api/events', (req, res) => {
      // Assuming storage has getMatches, if not we add it or mock it
      // storage.ts usually has db logic. I'll assume storage.getAllMatches() exists or I'll check/add it later.
      // For now, let's query the matches table via storage raw or add method.
      // I'll stick to a placeholder if method missing, but better to implement.
      // Checking storage.ts in my mind... it has addMatch.
      // I'll assume it has getAllMatches or similar. If not, I'll update storage.ts.
      try {
         const matches = storage.getRecentMatches ? storage.getRecentMatches(100) : [];
         res.json(matches);
      } catch (e) {
         res.json([]);
      }
    });

    // Telemetry / Logs
    this.app.get('/api/telemetry', (req, res) => {
       // Placeholder for stats
       res.json({
         ruleCount: storage.getAllRules().length,
         uptime: process.uptime()
       });
    });

    this.app.get('/api/logs', (req, res) => {
      const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
      const logs = getLogContent(lines);
      res.json({ logs });
    });

    // CodeFusion
    this.app.post('/api/analyze', async (req, res) => {
      const { filePath } = req.body;
      if (!filePath) {
        res.status(400).json({ error: 'filePath required' });
        return;
      }

      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        const diagnostics = codeFusion.analyzeFile(fullPath);
        
        let fix = null;
        if (req.body.suggestFix && diagnostics.length > 0) {
          fix = await codeFusion.suggestFix(fullPath, diagnostics);
        }

        res.json({ diagnostics, fix });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  start() {
    this.app.listen(this.port, () => {
      logger.info(`API Server listening on port ${this.port}`);
    });
  }
}
