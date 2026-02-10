import pino from 'pino';
import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || './logs';

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getLogFilePath = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `heyamara-${date}.log`);
};

export const currentLogFile = getLogFilePath();

const transport = pino.transport({
  target: 'pino/file',
  options: { destination: currentLogFile, mkdir: true },
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

export const getLogContent = (lines = 100): string[] => {
  const logFile = getLogFilePath();
  if (!fs.existsSync(logFile)) return [];
  
  // Simple tail implementation
  const content = fs.readFileSync(logFile, 'utf-8');
  const allLines = content.split('\n').filter(Boolean);
  return allLines.slice(-lines);
};