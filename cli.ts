#!/usr/bin/env ts-node
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4289';

interface LoginResponse {
  accessToken: string;
}

async function login() {
  const res = await axios.post<LoginResponse>(`${API_URL}/auth/login`, { username: 'admin' });
  return res.data.accessToken;
}

async function addRule(token: string, ruleText: string) {
  const res = await axios.post(
    `${API_URL}/api/rules`,
    { rule: ruleText },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Rule added:', res.data);
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'add' && args[1]) {
    const ruleText = args.slice(1).join(' ');
    const token = await login();
    await addRule(token, ruleText);
  } else {
    console.log('Usage: npx ts-node cli.ts add "your rule here"');
    console.log('Example: npx ts-node cli.ts add "notify me when TypeScript files change"');
  }
}

main().catch(console.error);
