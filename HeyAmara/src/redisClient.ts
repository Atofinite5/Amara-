import { createClient, RedisClientType } from 'redis';
import { logger } from './telemetry';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = createClient({ url });

    this.client.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected');
    });
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async storeRefreshToken(userId: string, tokenId: string, data: any, ttlSeconds = 604800) { // 7 days
    await this.connect();
    const key = `rt:${userId}:${tokenId}`;
    await this.client.set(key, JSON.stringify(data), { EX: ttlSeconds });
  }

  async getRefreshToken(userId: string, tokenId: string) {
    await this.connect();
    const key = `rt:${userId}:${tokenId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async blacklistToken(tokenId: string, ttlSeconds = 3600) {
    await this.connect();
    await this.client.set(`bl:${tokenId}`, '1', { EX: ttlSeconds });
  }

  async isBlacklisted(tokenId: string): Promise<boolean> {
    await this.connect();
    const exists = await this.client.get(`bl:${tokenId}`);
    return exists === '1';
  }

  async rateLimit(ip: string, limit: number, windowSeconds = 60): Promise<boolean> {
    await this.connect();
    const key = `rl:${ip}`;
    const requests = await this.client.incr(key);
    
    if (requests === 1) {
      await this.client.expire(key, windowSeconds);
    }

    return requests <= limit;
  }

  async cacheRule(ruleId: string, ruleObject: any) {
    await this.connect();
    await this.client.set(`rule:${ruleId}`, JSON.stringify(ruleObject), { EX: 3600 });
  }

  async cacheEvent(eventObject: any) {
    await this.connect();
    // Cache recent events in a list, trim to last 100
    await this.client.lPush('recent_events', JSON.stringify(eventObject));
    await this.client.lTrim('recent_events', 0, 99);
  }
}

export const redisClient = new RedisService();
