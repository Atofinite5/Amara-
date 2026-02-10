# HeyAmara Architecture

## Overview
HeyAmara is a local daemon that watches file system events and triggers notifications based on natural language rules. It uses a local LLM to parse rules and evaluate content.

## Components

### 1. Daemon (`src/daemon.ts`)
- **Role**: Entry point and orchestrator.
- **Responsibility**: 
  - Manages process lifecycle (Cluster module for crash recovery).
  - Initializes components (Storage, Watcher, API).
  - Main Event Loop: Listen to Watcher -> Match Rules -> Notify.

### 2. Watcher (`src/watcher.ts`)
- **Role**: File system observer.
- **Responsibility**:
  - Uses `chokidar` to watch directories.
  - Normalizes events (create, update, delete).
  - Reads `.gitignore` to filter noise.
  - Emits events to Daemon.

### 3. Rule Engine (`src/ruleEngine.ts`)
- **Role**: Logic core.
- **Responsibility**:
  - **Parsing**: Converts Natural Language -> JSON Predicate using `llm.ts`.
  - **Evaluation**: Checks file path (glob) and content (regex/keyword) against predicates.

### 4. LLM Adapter (`src/llm.ts`)
- **Role**: AI Interface.
- **Responsibility**:
  - Abstract interface for LLM providers.
  - Default implementation: **Ollama** (Local).
  - Supports switching to other providers if configured.
  - Tracks token usage.

### 5. Storage (`src/storage.ts`)
- **Role**: Persistence.
- **Responsibility**:
  - **SQLite** database (`amara.db`).
  - Stores: Active Rules, Match History, Failure Logs.
  - Persists state across restarts.

### 6. Notifier (`src/notifier.ts`)
- **Role**: Output channel.
- **Responsibility**:
  - Desktop Notifications (`node-notifier`).
  - Webhooks.
  - Stdout logs.
  - Rate limiting and retry queue.

### 7. API (`src/api.ts`)
- **Role**: Interface.
- **Responsibility**:
  - REST endpoints (`/rules`, `/status`, `/logs`).
  - Allows external tools (or CLI) to manage the daemon.

## Data Flow
1. **Rule Creation**: User POST `/rules` -> API -> LLM Parse -> Storage.
2. **File Change**: OS Event -> Watcher -> Daemon.
3. **Evaluation**: Daemon iterates Rules -> Checks Path -> Checks Content (if needed).
4. **Action**: Match -> Storage (History) -> Notifier -> User.

## Concurrency
- **Node.js Event Loop**: Handles non-blocking I/O (Watcher, API).
- **Cluster**: Master process monitors Worker process.
- **Queues**: Notification queue handles rate limits asynchronously.

## Local LLM Strategy
- Rules are parsed *once* upon creation into optimized JSON predicates.
- Runtime evaluation uses fast string matching/regex (CPU) where possible.
- LLM is *not* invoked on every file change unless a rule strictly requires semantic understanding (current implementation optimizes to regex/keywords to avoid latency).
