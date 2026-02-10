import { Request, Response } from 'express';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from './jwt';
import { redisClient } from '../redisClient';

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    // Check blacklist
    if (await redisClient.isTokenBlacklisted(token)) {
      res.status(403).json({ error: 'Token revoked' });
      return;
    }

    const decoded = verifyRefreshToken(token) as any;
    
    // Rotate tokens
    const newAccessToken = signAccessToken(decoded.userId);
    const newRefreshToken = signRefreshToken(decoded.userId);

    // Blacklist old refresh token
    await redisClient.blacklistToken(token, 7 * 24 * 3600);
    
    res.cookie('refreshToken', newRefreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({ accessToken: newAccessToken });

  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};
