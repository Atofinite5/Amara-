import * as esbuild from 'esbuild';
import path from 'path';

async function build() {
  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, '../src/daemon.ts')],
      outfile: path.join(__dirname, '../dist/amara.js'),
      bundle: true,
      platform: 'node',
      target: 'node20',
      external: [
        'better-sqlite3',
        'node-notifier',
        'pino',
        'tslib',
        'chokidar',
        'redis',
        'express',
        'cors',
        'cookie-parser',
        'jsonwebtoken',
        'axios',
        'uuid',
        'bcrypt',
        '@supabase/supabase-js',
        'fsevents',
        'cluster',
        'fs',
        'path',
        'os'
      ],
      sourcemap: true,
      minify: false,
    });
    console.log('Build complete: dist/amara.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
