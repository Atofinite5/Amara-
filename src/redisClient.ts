import { createClient } from 'redis';
import { logger } from './telemetry';

class RedisClientService {
  private client: any;
  private isConnected = false;
  private isMock = false;

  constructor() {
    if (process.env.MOCK_REDIS === 'true') {
      this.isMock = true;
      this.isConnected = true;
      this.client = {
        on: () => {},
        connect: async () => { logger.info('Mock Redis connected'); },
        disconnect: async () => {},
        set: async () => {},
        get: async () => null,
        del: async () => {},
        exists: async () => 0,
        incr: async () => 1,
        expire: async () => {},
      };
      logger.info('Redis Client initialized in MOCK mode');
    } else {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err: any) => logger.error({ err }, 'Redis Client Error'));
      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis Client Connected');
      });
    }
  }

  async connect() {
    if (!this.isConnected && !this.isMock) {
      await this.client.connect();
    } else if (this.isMock) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Auth / Tokens
  async storeRefreshToken(userId: string, tokenId: string, data: any, ttlSeconds: number) {
    if (this.isMock) return;
    const key = `rt:${userId}:${tokenId}`;
    await this.client.set(key, JSON.stringify(data), { EX: ttlSeconds });
  }

  async getRefreshToken(userId: string, tokenId: string) {
    if (this.isMock) return null;
    const key = `rt:${userId}:${tokenId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteRefreshToken(userId: string, tokenId: string) {
    if (this.isMock) return;
    const key = `rt:${userId}:${tokenId}`;
    await this.client.del(key);
  }

  async blacklistToken(tokenId: string, ttlSeconds: number) {
    if (this.isMock) return;
    const key = `bl:${tokenId}`;
    await this.client.set(key, '1', { EX: ttlSeconds });
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    if (this.isMock) return false;
    const key = `bl:${tokenId}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  // Rate Limiting
  async rateLimit(ip: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (this.isMock) return true;
    const key = `rate:${ip}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }

    return current <= limit;
  }

  // Caching
  async cacheRule(ruleId: string, ruleObject: any) {
    if (this.isMock) return;
    await this.client.set(`rule:${ruleId}`, JSON.stringify(ruleObject), { EX: 3600 });
  }

  async getCachedRule(ruleId: string) {
    if (this.isMock) return null;
    const data = await this.client.get(`rule:${ruleId}`);
    return data ? JSON.parse(data) : null;
  }
}

export const redisClient = new RedisClientService();
