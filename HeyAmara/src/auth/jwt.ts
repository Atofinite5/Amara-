import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../redisClient';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret-123';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-123';

export const signAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
};

export const signRefreshToken = async (userId: string) => {
  const tokenId = uuidv4();
  const token = jwt.sign({ userId, tokenId }, REFRESH_SECRET, { expiresIn: '7d' });
  
  await redisClient.storeRefreshToken(userId, tokenId, { valid: true });
  
  return token;
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as { userId: string };
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as { userId: string; tokenId: string };
    
    // Check blacklist/storage
    const isBlacklisted = await redisClient.isBlacklisted(decoded.tokenId);
    if (isBlacklisted) return null;

    const stored = await redisClient.getRefreshToken(decoded.userId, decoded.tokenId);
    if (!stored || !stored.valid) return null;

    return decoded;
  } catch (err) {
    return null;
  }
};
