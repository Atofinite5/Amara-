import { Request, Response } from 'express';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from './jwt';
import { redisClient } from '../redisClient';

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const decoded = await verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }

  // Rotate tokens: Blacklist old RT, issue new AT + RT
  await redisClient.blacklistToken(decoded.tokenId);

  const newAccessToken = signAccessToken(decoded.userId);
  const newRefreshToken = await signRefreshToken(decoded.userId);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({ accessToken: newAccessToken });
};
