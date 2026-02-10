# Amara — Local AI Daemon for Intelligent File Automation

> A Hybrid Local-First + Cloud-Optional Autonomous Watcher System

## Overview

Amara is a TypeScript-based, always-on local daemon that monitors your filesystem, interprets natural-language rules, automates actions, logs system behavior, and optionally synchronizes data to a cloud backend. It is designed for developers who work deeply with AI-assisted coding and need a reliable companion that observes, learns, and responds intelligently.

Amara follows a local-first architecture, with optional hybrid cloud capabilities via Supabase and secure session management using Redis and JWT. The system is modular, secure, and extendable.

## Core Capabilities

### 1. File Watching
Amara monitors configured directories and reacts to file creation, modification, and deletion events in real-time.

### 2. Natural-Language Rule Learning
Users can describe rules in plain English. Amara uses a local LLM (Ollama: Llama3 or Qwen2.5) to convert natural language into structured logic.
*Example*: “Notify me when any .txt file containing the word urgent is modified.”

### 3. Autonomous Rule Engine
Amara evaluates all incoming file events against stored rules, checking trigger types, filename patterns, content, and size conditions.

### 4. Advanced System Features
*   **CodeFusion Engine**: A TypeScript analysis engine that detects errors and requests auto-fixes using a local LLM.
*   **Redis Security Layer**: Manages refresh tokens, blacklisting, sessions, and caching.
*   **JWT Session Management**: Uses short-lived access tokens and rotating refresh tokens (HTTP-only cookies).
*   **Supabase Cloud Sync**: Synchronizes rules, events, and telemetry to Supabase when online.

---

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Atofinite5/Amara-.git
cd Amara
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Local LLM (Ollama)
```bash
ollama pull llama3
# or
ollama pull qwen2.5
```

### 4. Environment Setup
Copy the example environment file and configure it:
```bash
cp .env.example .env
```
Edit `.env` with your credentials:
*   `SUPABASE_URL`: Your project URL (e.g., `https://xyz.supabase.co`)
*   `SUPABASE_KEY`: Your Anon Public Key
*   `REDIS_URL`: URL for your Redis instance (default: `redis://localhost:6379`)

### 5. Start the Daemon
```bash
npm start
# or for development
npm run dev
```

---

## Developer Guide & Demos

### Supabase Integration Demo
To verify your Supabase connection and plugin functionality:
```bash
npx ts-node examples/supabase_demo.ts
```

### Testing
Run the comprehensive test suite:
```bash
npm test
```

---

## License
MIT License
