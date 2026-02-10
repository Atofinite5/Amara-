# HeyAmara Architecture

## Overview

HeyAmara is a production-ready TypeScript daemon that monitors file system events and triggers notifications based on natural language rules. It provides a robust, scalable solution for monitoring file changes with intelligent rule evaluation powered by local LLMs.

## Core Components

### 1. Daemon (src/daemon.ts)
The main entry point that orchestrates all components:
- Uses Node.js cluster module for crash resilience
- Manages lifecycle and worker processes
- Handles graceful shutdown procedures

### 2. Watcher (src/watcher.ts)
File system monitoring using chokidar:
- Watches for file creation, modification, deletion events
- Respects .gitignore patterns
- Reads file content for content-based rule evaluation
- Implements awaitWriteFinish for stability

### 3. Rule Engine (src/ruleEngine.ts)
Intelligent rule processing:
- Parses natural language rules into structured JSON predicates using LLMs
- Evaluates file content against rule predicates
- Supports glob patterns, regex matching, and negation

### 4. Storage (src/storage.ts)
Persistent data management using SQLite:
- Stores rules, match history, and failure logs
- Provides CRUD operations for rules
- Maintains historical data for auditing

### 5. Notifier (src/notifier.ts)
Multi-channel notification system:
- Desktop notifications via node-notifier
- Webhook notifications
- Standard output logging
- Rate limiting and queuing for notification delivery

### 6. LLM Integration (src/llm.ts)
Local AI-powered rule parsing:
- Ollama provider as default (no cloud calls)
- Support for cloud providers (Claude, GLM-4, Kimi-2.5) if configured
- Mock provider for testing environments
- Factory pattern for provider selection

### 7. Telemetry (src/telemetry.ts)
Comprehensive logging system:
- Pino-based structured logging
- Rotating file logs with daily timestamps
- Configurable log levels
- Log content retrieval API

### 8. API Server (src/api.ts)
RESTful interface for management:
- Rule CRUD operations
- Match history retrieval
- Log viewing
- Health checks

## Data Flow

1. **File Event Detection**: Watcher detects file system events
2. **Rule Evaluation**: Each active rule is evaluated against the event
3. **Content Analysis**: If rule requires content matching, file content is analyzed
4. **Notification Dispatch**: Matching rules trigger notifications via queued system
5. **Data Persistence**: Matches and failures are stored in SQLite database
6. **API Access**: Users can manage rules and view history through REST API

## Concurrency Model

- **Master Process**: Manages worker lifecycle and crash recovery
- **Worker Process**: Runs the actual daemon logic
- **Notification Queue**: Asynchronous notification processing with rate limiting
- **Database Connections**: Thread-safe SQLite operations

## Security & Reliability

- **No Cloud Calls**: Default configuration uses local Ollama only
- **Crash Resilience**: Cluster-based restart mechanism
- **Graceful Shutdown**: Proper cleanup on termination signals
- **Input Validation**: Zod schema validation for rule structures
- **Error Handling**: Comprehensive error logging and failure tracking

## Performance Considerations

- **File Watching**: Efficient chokidar implementation with gitignore support
- **Rate Limiting**: Notification throttling to prevent spam
- **Resource Management**: Proper cleanup of file handles and connections
- **Memory Efficiency**: Streaming log processing and bounded queues