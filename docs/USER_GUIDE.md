# HeyAmara User Guide

## 1. Introduction
**HeyAmara** is an intelligent file-watching daemon designed for developers. It monitors your filesystem for changes and triggers automated actions based on natural language rules. It features a static analysis engine (CodeFusion), security layers (Redis/JWT), and cloud synchronization.

> **Note**: This project is distinct from the Amara.org subtitling platform. This guide covers the HeyAmara developer tool.

---

## 2. Installation & Setup

### Prerequisites
- Node.js (v20+)
- Redis (for caching and auth)
- Supabase Account (optional, for cloud sync)

### Step-by-Step Setup
1.  **Clone the Repository**:
    ```bash
    git clone <repo-url>
    cd Amara
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    # Core
    PORT=4289
    
    # Security
    JWT_ACCESS_SECRET=your_access_secret
    JWT_REFRESH_SECRET=your_refresh_secret
    
    # Redis
    REDIS_URL=redis://localhost:6379
    
    # Cloud (Optional)
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_KEY=your-anon-key
    
    # AI Provider
    LLM_PROVIDER=ollama
    OLLAMA_HOST=http://localhost:11434
    ```
4.  **Build the Project**:
    ```bash
    npm run build
    ```
5.  **Start the Daemon**:
    ```bash
    npm start
    ```

---

## 3. Authentication Flow

HeyAmara uses a secure JWT-based authentication system.

1.  **Login**:
    Send a POST request to obtain access and refresh tokens.
    ```bash
    curl -X POST http://localhost:4289/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username": "admin"}'
    ```
    *Response*: `{ "accessToken": "ey..." }` (RefreshToken set in HTTP-only cookie)

2.  **Accessing Protected Resources**:
    Include the token in the `Authorization` header for all API calls.
    ```bash
    curl -H "Authorization: Bearer <token>" http://localhost:4289/api/rules
    ```

3.  **Refreshing Tokens**:
    When the access token expires (15m), call `/auth/refresh` to rotate tokens securely.

---

## 4. Creating & Managing Rules

Rules dictate how Amara responds to file events.

### Adding a Rule
Use natural language to define rules. The internal LLM parses these into structured triggers.

**Endpoint**: `POST /api/rules`
**Body**:
```json
{
  "rule": "When a TypeScript file is modified in src/, check for console.log usage and notify me"
}
```

### Listing Rules
**Endpoint**: `GET /api/rules`
Returns a list of active rules and their match history.

---

## 5. CodeFusion Engine (Analysis)

CodeFusion provides static analysis and AI-powered fix suggestions.

### Analyzing a File
**Endpoint**: `POST /api/analyze`
**Body**:
```json
{
  "filePath": "src/utils.ts",
  "suggestFix": true
}
```
**Response**:
- `diagnostics`: List of TypeScript errors (line, code, message).
- `fix`: (Optional) LLM-generated patch to resolve the errors.

---

## 6. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **Daemon fails to start** | Redis not running | Ensure `redis-server` is active or set `MOCK_REDIS=true` for testing. |
| **"Unauthorized" API Error** | Missing/Expired Token | Log in again via `/auth/login` to get a fresh token. |
| **Build fails on 'tslib'** | Dependency missing | Run `npm install tslib`. |
| **No notifications** | Watcher scope | Ensure the daemon is running in the correct root directory. |

---

## 7. Deliverables & Artifacts

- **`dist/amara.js`**: Single-file executable daemon.
- **`data/amara.db`**: Local SQLite database for rules and history.
- **`logs/`**: Structured logs for debugging and auditing.
