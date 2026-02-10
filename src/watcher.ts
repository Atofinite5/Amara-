import chokidar from 'chokidar';
import { logger } from './telemetry';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export type FileEventType = 'create' | 'update' | 'delete' | 'move';

export interface FileEvent {
  type: FileEventType;
  path: string;
  content?: string; // Only for create/update
}

export class Watcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.rootDir = path.resolve(rootDir);
  }

  start() {
    logger.info({ dir: this.rootDir }, 'Starting watcher...');
    
    // Read .gitignore if exists
    const ignored: (string | RegExp)[] = [
      /(^|[\/\\])\../, // dotfiles
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
    ];

    const gitignorePath = path.join(this.rootDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const lines = content.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
      // Simple gitignore handling: just add them as strings/globs
      // Note: This is not a full gitignore parser, but covers basic cases
      ignored.push(...lines);
    }

    this.watcher = chokidar.watch(this.rootDir, {
      ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath) => this.emitEvent('create', filePath))
      .on('change', (filePath) => this.emitEvent('update', filePath))
      .on('unlink', (filePath) => this.emitEvent('delete', filePath))
      .on('error', (error) => logger.error({ error }, 'Watcher error'));

    logger.info('Watcher started.');
  }

  private async emitEvent(type: FileEventType, filePath: string) {
    const absPath = path.resolve(filePath);
    let content: string | undefined;

    if (type === 'create' || type === 'update') {
      try {
        content = await fs.promises.readFile(absPath, 'utf-8');
      } catch (err) {
        logger.warn({ err, filePath }, 'Failed to read file content');
        return; // Don't emit if we can't read content (unless we want to support name-only rules)
      }
    }

    this.emit('event', {
      type,
      path: absPath,
      content,
    } as FileEvent);
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      logger.info('Watcher stopped.');
    }
  }
}

export const watcher = new Watcher();
