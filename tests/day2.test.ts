import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { ApiServer } from '../src/api';
import { signAccessToken, verifyAccessToken } from '../src/auth/jwt';
import { codeFusion } from '../src/codeFusion';
import { redisClient } from '../src/redisClient';
import path from 'path';
import fs from 'fs';

// Mock Redis to avoid connection errors
jest.mock('../src/redisClient', () => ({
  redisClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    storeRefreshToken: jest.fn(),
    getRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    rateLimit: jest.fn().mockResolvedValue(true),
    cacheRule: jest.fn(),
    getCachedRule: jest.fn()
  }
}));

// Mock Supabase
jest.mock('../src/cloud/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn()
    })
  }
}));

describe('Day-2 Integration Tests', () => {
  let app: express.Application;
  let apiServer: ApiServer;

  beforeAll(() => {
    // Setup API Server
    apiServer = new ApiServer(() => {});
    app = (apiServer as any).app; // Access private app for supertest
  });

  describe('JWT Auth', () => {
    it('should sign and verify access token', () => {
      const token = signAccessToken('test-user');
      const decoded = verifyAccessToken(token) as any;
      expect(decoded.userId).toBe('test-user');
    });

    it('should protect /api/rules endpoint', async () => {
      const res = await request(app).get('/api/rules');
      expect(res.status).toBe(401); // Unauthorized
    });

    it('should allow access with valid token', async () => {
      const token = signAccessToken('test-user');
      const res = await request(app)
        .get('/api/rules')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('CodeFusion Engine', () => {
    const testFile = path.join(__dirname, 'temp_bad.ts');

    beforeAll(() => {
      // Create a file with a type error
      fs.writeFileSync(testFile, `
        const x: number = "string"; // Error: Type string is not assignable to type number
        console.log(x);
      `);
    });

    afterAll(() => {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    });

    it('should detect type errors in a file', () => {
      const diagnostics = codeFusion.analyzeFile(testFile);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].message).toContain('Type');
      expect(diagnostics[0].line).toBe(2);
    });
  });

  describe('API Endpoints', () => {
    it('should login and get tokens', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined(); // Refresh token cookie
    });

    it('should analyze code via API', async () => {
      const token = signAccessToken('test-user');
      // Create a dummy file for this test too if needed, or use existing one
      const tempFile = path.join(__dirname, 'api_test_file.ts');
      fs.writeFileSync(tempFile, 'const a = 1;');

      const res = await request(app)
        .post('/api/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({ filePath: tempFile });

      fs.unlinkSync(tempFile);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('diagnostics');
    });
  });
});
