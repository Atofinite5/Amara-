# Self Report

## A. Extra Features
1. **Cluster-based Crash Guard**: Implemented a Master-Worker architecture using Node's `cluster` module to automatically respawn the daemon if it crashes.
2. **Multi-Provider LLM Factory**: Extensible architecture supporting Ollama (default) but ready for Cloud providers if configured.
3. **Rate-Limited Notification Queue**: Prevents notification spam using a token bucket-like delay mechanism.
4. **GitIgnore Support**: Automatically reads `.gitignore` to prevent watching ignored files.

## B. Token Count & Cost
- **Demo Run**:
  - Rule Parsing: ~150 tokens per rule (Input) + ~50 tokens (Output).
  - Cost (Ollama/Local): 0 (Compute only).
  - Evaluation: 0 tokens (Optimized to Regex/Glob execution without LLM calls during hot path).

## C. Failure Modes & Limits
1. **Large Files**: Reading entire file content into memory for content matching can spike memory usage. Stream-based matching would be an improvement for >100MB files.
2. **High Frequency Events**: `node_modules` churn can overwhelm the watcher if not properly ignored (mitigated by default ignores).
3. **LLM Availability**: If Ollama is down, rule creation fails. Daemon continues to run with existing rules.
4. **Scale**: SQLite can handle thousands of rules, but linear iteration in JavaScript (O(N) rules per file event) might slow down at >5000 active rules.

## D. Key Trade-offs
1. **Speed vs. Semantic Accuracy**: 
   - *Decision*: Convert NL rules to JSON predicates (Glob/Regex) once.
   - *Trade-off*: We lose "deep semantic" understanding during runtime (e.g., "is this code elegant?") but gain millisecond-latency response times. Running LLM on every file save would be too slow (>500ms).
2. **Memory vs. Disk**:
   - *Decision*: Keep active rules in memory, logs in disk/SQLite.
   - *Trade-off*: Fast matching, low memory footprint (<100MB typical), but requires loading rules on startup.
3. **Single Node**:
   - *Decision*: Local SQLite and FS.
   - *Trade-off*: Simple deployment, privacy-first, but no multi-device sync.
