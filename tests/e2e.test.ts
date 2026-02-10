import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';

const PORT = 4289;
const API_URL = `http://localhost:${PORT}`;
const WORK_DIR = path.join(__dirname, 'temp_e2e_workspace');

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('E2E Daemon Test', () => {
  let daemonProcess: ChildProcess;

  beforeAll(async () => {
    // Setup workspace
    if (fs.existsSync(WORK_DIR)) {
      fs.rmSync(WORK_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(WORK_DIR, { recursive: true });

    // Start Daemon
    // We use ts-node to run directly from source for testing
    // Set DB_DIR and LOG_DIR to temp to avoid polluting project
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      LLM_PROVIDER: 'mock',
      MOCK_REDIS: 'true',
      DB_DIR: path.join(WORK_DIR, 'data'),
      LOG_DIR: path.join(WORK_DIR, 'logs'),
      PORT: PORT.toString(), // Ensure port matches
    };

    console.log('Starting daemon...');
    daemonProcess = spawn('npx', ['ts-node', 'src/daemon.ts'], {
      cwd: path.join(__dirname, '../'),
      env,
      stdio: 'pipe', // Capture stdio
    });

    daemonProcess.stdout?.on('data', (data) => console.log(`Daemon: ${data}`));
    daemonProcess.stderr?.on('data', (data) => console.error(`Daemon Err: ${data}`));

    // Wait for API to be ready
    let ready = false;
    for (let i = 0; i < 20; i++) { // 20 attempts
      try {
        await axios.get(`${API_URL}/status`);
        ready = true;
        break;
      } catch (e) {
        await delay(500);
      }
    }
    
    if (!ready) throw new Error('Daemon failed to start within 10s');
  }, 15000);

  afterAll(() => {
    if (daemonProcess) {
      daemonProcess.kill('SIGTERM');
    }
    // Cleanup
    if (fs.existsSync(WORK_DIR)) {
      fs.rmSync(WORK_DIR, { recursive: true, force: true });
    }
  });

  test('Should accept a rule, detect file change, and notify', async () => {
    // 0. Login to get token
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, { username: 'admin' });
    const token = (loginRes.data as any).accessToken;
    expect(token).toBeDefined();

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Inject Rule
    const ruleText = "notify me whenever a TypeScript file adds an import from ‘axios’";
    console.log('Injecting rule...');
    const ruleRes = await axios.post(`${API_URL}/api/rules`, { rule: ruleText }, { headers: authHeaders });
    expect(ruleRes.status).toBe(201);
    expect((ruleRes.data as any).natural_language).toBe(ruleText);

    // 2. Create/Touch matching file
    const testFile = path.join(__dirname, '../temp_test_file.ts');
    
    // Initial content
    fs.writeFileSync(testFile, 'import React from "react";');
    
    await delay(1000); // Let watcher pick up creation (might be ignored or irrelevant)

    // 3. Update file to trigger rule
    console.log('Updating file to trigger rule...');
    fs.writeFileSync(testFile, 'import React from "react";\nimport axios from "axios";');

    // 4. Wait for notification/log
    // We can check the /logs endpoint or the internal logs
    let triggered = false;
    for (let i = 0; i < 10; i++) { // 5 seconds
      await delay(500);
      const logsRes = await axios.get(`${API_URL}/api/logs?lines=50`, { headers: authHeaders });
      const logs = (logsRes.data as any).logs as string[];
      // Look for match log
      if (logs.some(l => l.includes('Rule matched!') && l.includes('temp_test_file.ts'))) {
        triggered = true;
        break;
      }
    }

    expect(triggered).toBe(true);

    // Cleanup file
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  }, 10000);
});
