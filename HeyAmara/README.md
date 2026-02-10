# HeyAmara

A production-ready TypeScript daemon for intelligent file system monitoring with natural language rules and local LLM integration.

## Features

- **File System Monitoring**: Real-time monitoring of file creation, modification, and deletion events
- **Natural Language Rules**: Define rules using plain English with local LLM parsing
- **Multi-channel Notifications**: Desktop alerts, webhook notifications, and console output
- **Persistent Storage**: SQLite database for rules, match history, and failure logs
- **REST API**: Manage rules and view history through a local HTTP API
- **Crash Resilience**: Automatic restart on failure using Node.js cluster module
- **Zero Cloud Dependencies**: Default configuration uses local Ollama only
- **Comprehensive Logging**: Structured logging with daily rotation

## Prerequisites

- Node.js 18+
- npm or yarn
- Ollama (for natural language rule parsing)

## Installation

```bash
cd HeyAmara
npm install
```

## Quick Start

1. **Add a test rule**:
   ```bash
   npm run test
   ```

2. **Start the daemon**:
   ```bash
   npm start
   ```

3. **Create a file that matches your rule**:
   ```bash
   echo "This is an ERROR message" > test.txt
   ```

4. **View notifications**: Check your desktop notifications or console output

## API Usage

The daemon exposes a REST API on port 4289 by default:

- `GET /api/rules` - List all rules
- `POST /api/rules` - Add a new rule
- `DELETE /api/rules/:id` - Delete a rule
- `GET /api/matches` - View recent matches
- `GET /api/logs` - View recent logs
- `GET /health` - Health check endpoint

### Adding a Rule via API

```bash
curl -X POST http://localhost:4289/api/rules \
  -H "Content-Type: application/json" \
  -d '{"naturalLanguage": "Notify me when a TypeScript file imports axios"}'
```

## Configuration

Environment variables:

- `API_PORT` - API server port (default: 4289)
- `LOG_LEVEL` - Logging level (default: info)
- `DB_DIR` - Database directory (default: ./data)
- `LOG_DIR` - Log directory (default: ./logs)
- `WEBHOOK_URL` - Webhook URL for notifications
- `OLLAMA_HOST` - Ollama server host (default: http://localhost:11434)
- `OLLAMA_MODEL` - Ollama model name (default: llama3)

## Building

To create a production bundle:

```bash
npm run build
```

This creates a single executable bundle at `dist/heyamara.js`.

## Testing

Run the test suite:

```bash
npm test
```

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture information.

## Self Report

See [SELF_REPORT.md](docs/SELF_REPORT.md) for implementation details and trade-offs.