# HeyAmara Day-2 Demo Script

## 1. Architecture Summary
- **Hybrid Core**: TypeScript daemon with Node.js cluster for resilience.
- **Local Intelligence**: CodeFusion engine uses TypeScript Compiler API + Local LLM (Ollama) for static analysis and fix suggestions.
- **Cloud Sync**: Real-time bidirectional sync with Supabase (Rules, Events, Telemetry).
- **High Performance**: Redis caching for rules, events, and rate limiting.
- **Security**: JWT-based auth with Refresh Token rotation and Redis blacklisting.

## 2. How Rules Work
1. **Creation**: User defines natural language rule via API.
2. **Parsing**: Local LLM converts it to structured JSON predicate.
3. **Storage**: Saved to SQLite (local) and synced to Supabase (cloud).
4. **Caching**: Hot rules cached in Redis for <1ms access.
5. **Execution**: File events match against predicates; matching triggers notifications + fixes.

## 3. How Sync Works
- **Push**: Local changes (new rule, match event) are pushed to Supabase immediately.
- **Pull**: On startup, latest rules are fetched from Supabase.
- **Realtime**: Daemon subscribes to Supabase `postgres_changes`. Cloud rule updates apply instantly to all connected daemons.

## 4. How CodeFusion Works
1. **Analysis**: `analyzeFile()` runs TS compiler to find diagnostics (errors/warnings).
2. **Context**: Extracts code context around the error.
3. **Suggestion**: Sends error + context to Local LLM.
4. **Fix**: LLM generates patch-like code fix.
5. **Delivery**: Fixes returned via API for user approval.

## 5. What Breaks at Scale
- **File Watching**: Chokidar (inotify/fsevents) scales poorly >100k files. Solution: Watchman or specialized drivers.
- **LLM Latency**: Local LLM inference on every error is slow. Solution: Batch processing or smaller specialized models.
- **Redis Memory**: Caching every event can overflow. Solution: Aggregation pipelines or shorter TTLs.
- **Supabase Connections**: Many daemons = many realtime connections. Solution: Edge proxy / Supabase Realtime clustering.
