import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwt';
import { logger } from '../telemetry';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt');
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
};
