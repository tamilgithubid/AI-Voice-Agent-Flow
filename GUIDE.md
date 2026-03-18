# Agent Flow AI — Complete Setup & User Guide

A production-ready AI agent system with a ChatGPT-like interface, powered by Google Gemini, Node.js, React, n8n workflows, Redis memory, and real-time streaming.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Getting a Gemini API Key](#4-getting-a-gemini-api-key)
5. [Configuration (.env Setup)](#5-configuration-env-setup)
6. [Running the Backend](#6-running-the-backend)
7. [Running the Frontend](#7-running-the-frontend)
8. [Running with Docker (Production)](#8-running-with-docker-production)
9. [n8n Workflow Setup](#9-n8n-workflow-setup)
10. [Using the Chat UI](#10-using-the-chat-ui)
11. [Voice Assistant](#11-voice-assistant)
12. [API Reference](#12-api-reference)
13. [Testing](#13-testing)
14. [Monitoring & Metrics](#14-monitoring--metrics)
15. [Troubleshooting](#15-troubleshooting)
16. [Production Deployment](#16-production-deployment)

---

## 1. Architecture Overview

```
┌─────────────┐     HTTP/SSE/WS      ┌──────────────┐      Gemini API      ┌─────────────┐
│  React UI   │ ◄──────────────────► │  Node.js API │ ◄──────────────────► │  Google     │
│  (Port 3000)│                      │  (Port 3001) │                      │  Gemini AI  │
└─────────────┘                      └──────┬───────┘                      └─────────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │             │             │
                        ┌─────▼────┐  ┌─────▼────┐  ┌────▼─────┐
                        │  Redis   │  │  n8n     │  │  Tools   │
                        │  Memory  │  │  Workflow │  │  Engine  │
                        │  (6379)  │  │  (5678)  │  │          │
                        └──────────┘  └──────────┘  └──────────┘
```

**Data Flow:**
1. User types a message in the React chat UI
2. Message is sent to the Node.js backend API
3. Backend fetches conversation history from Redis (or in-memory fallback)
4. Backend sends the message + history to Google Gemini AI
5. Gemini decides: respond directly OR call a tool (get_resume, analyze_resume, etc.)
6. If tool call → backend executes the tool, sends result back to Gemini → Gemini responds
7. Response streams back to the UI token-by-token via SSE or WebSocket

**Available AI Tools:**
| Tool | Description |
|------|-------------|
| `get_resume` | Fetches a user's resume data |
| `analyze_resume` | Scores and analyzes a resume (ATS compatibility, section scores) |
| `improve_resume` | Generates specific improvement suggestions for any section |
| `save_resume` | Saves updated resume data |

---

## 2. Prerequisites

Install these before proceeding:

| Software | Version | Install |
|----------|---------|---------|
| **Node.js** | v18+ | https://nodejs.org (download LTS) |
| **npm** | v9+ | Comes with Node.js |
| **Git** | Any | `xcode-select --install` (macOS) |
| **Docker** | Optional | https://docker.com (for production mode) |
| **Redis** | Optional | `brew install redis` (macOS) or use Docker |

**Verify installations:**
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show v9.x or higher
git --version     # Should show any version
```

---

## 3. Project Structure

```
Agent-flow/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── config/index.js     # Configuration (reads .env)
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authentication
│   │   │   ├── rateLimiter.js  # Rate limiting per user
│   │   │   └── validate.js     # Request validation (Zod)
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /api/auth/token
│   │   │   ├── chat.js         # POST /api/chat (main endpoint)
│   │   │   ├── health.js       # GET /health, GET /health/metrics
│   │   │   └── resume.js       # GET/POST /api/resume
│   │   ├── services/
│   │   │   ├── agent.js        # AI agent logic (Gemini + tool loop)
│   │   │   ├── redis.js        # Memory storage (Redis or in-memory)
│   │   │   └── tools.js        # Tool implementations
│   │   ├── utils/
│   │   │   ├── logger.js       # Winston logger
│   │   │   └── metrics.js      # Prometheus metrics
│   │   └── server.js           # Express + WebSocket server entry
│   ├── tests/                  # Jest test files
│   ├── .env                    # Environment config (YOU CREATE THIS)
│   ├── Dockerfile              # Docker build file
│   └── package.json
│
├── frontend/                   # React chat UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.js   # Main chat container
│   │   │   ├── ChatMessage.js  # Individual message bubble
│   │   │   └── ChatInput.js    # Input box + voice button
│   │   ├── hooks/
│   │   │   ├── useChat.js      # Chat state + API calls
│   │   │   └── useVoice.js     # Speech-to-text / text-to-speech
│   │   ├── services/
│   │   │   └── api.js          # API client (REST + SSE + WebSocket)
│   │   ├── styles/
│   │   │   └── App.css         # Full dark theme styles
│   │   ├── App.js
│   │   └── index.js
│   ├── public/index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── n8n/
│   └── workflow.json           # Importable n8n workflow
│
├── monitoring/
│   └── prometheus.yml          # Prometheus scrape config
│
├── scripts/
│   ├── start-dev.sh            # One-command dev startup
│   └── start-prod.sh           # One-command production startup
│
├── docker-compose.yml          # Full stack Docker setup
├── .env.example                # Template for root .env
└── GUIDE.md                    # THIS FILE
```

---

## 4. Getting a Gemini API Key

**Step 1:** Go to https://aistudio.google.com/apikey

**Step 2:** Sign in with your Google account

**Step 3:** Click **"Create API Key"**

**Step 4:** Select a Google Cloud project (or create a new one)

**Step 5:** Copy the key — it looks like: `AIzaSy...` (39 characters)

**Important notes:**
- The free tier gives you **1,500 requests/day** for `gemini-2.0-flash`
- If you hit quota limits, either wait 24 hours or create a key from a **new project**
- To get unlimited usage, enable billing at https://console.cloud.google.com/billing
- **Never share your API key publicly or commit it to git**

---

## 5. Configuration (.env Setup)

### Backend .env (REQUIRED)

Create the file `/Agent-flow/backend/.env`:

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` with your values:

```env
# Server
PORT=3001
NODE_ENV=development

# Google Gemini (REQUIRED — get key from https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash

# Redis (optional — app works without it using in-memory storage)
REDIS_URL=redis://localhost:6379

# n8n (optional — only needed if using n8n workflows)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/ai-agent

# JWT Authentication
JWT_SECRET=generate-a-random-string-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Root .env (only for Docker Compose)

Create `/Agent-flow/.env` only if using Docker:

```env
GEMINI_API_KEY=your-gemini-api-key-here
JWT_SECRET=your-jwt-secret
N8N_PASSWORD=your-n8n-password
N8N_ENCRYPTION_KEY=your-encryption-key
GRAFANA_PASSWORD=admin
```

### Configuration checklist

- [ ] `GEMINI_API_KEY` is set and is on **one single line** (no line breaks)
- [ ] `GEMINI_MODEL` is set to `gemini-2.0-flash` (or `gemini-1.5-pro` if available)
- [ ] `JWT_SECRET` is set to a random string
- [ ] `CORS_ORIGIN` matches your frontend URL

---

## 6. Running the Backend

### Install dependencies

```bash
cd /path/to/Agent-flow/backend
npm install
```

### Start in development mode (auto-restarts on file changes)

```bash
npm run dev
```

### Start in production mode

```bash
npm start
```

### Expected output

```
warn: Redis not available — using in-memory storage
info: Agent Flow API running on port 3001
info: WebSocket server running on ws://localhost:3001/ws
info: Environment: development
```

The "Redis not available" warning is **fine** — the app automatically uses in-memory storage. Chat history just won't persist across server restarts.

### Verify it's working

```bash
# Health check
curl http://localhost:3001/health

# Expected: {"status":"healthy","timestamp":"...","uptime":...}
```

```bash
# Test resume API
curl http://localhost:3001/api/resume/user-1 -H "X-User-Id: user-1"

# Expected: {"success":true,"data":{"name":"John Doe",...}}
```

```bash
# Test chat (requires valid Gemini API key)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-1" \
  -d '{"message": "Hello! Can you help me with my resume?"}'

# Expected: {"success":true,"data":{"response":"...","threadId":"..."}}
```

---

## 7. Running the Frontend

Open a **new terminal** (keep the backend running):

### Install dependencies

```bash
cd /path/to/Agent-flow/frontend
npm install
```

### Start the development server

```bash
npm start
```

### Expected output

```
Compiled successfully!

You can now view agent-flow-frontend in the browser.

  Local:            http://localhost:3000
```

Your browser should open automatically. If not, go to **http://localhost:3000**.

### What you should see

- A dark-themed chat interface
- A welcome screen with the title "Agent Flow AI"
- Four suggestion buttons:
  - "View my resume"
  - "Analyze my resume"
  - "Improve my summary"
  - "Skill suggestions"
- A text input box at the bottom with a microphone button and send button

---

## 8. Running with Docker (Production)

This starts **all 6 services** at once: backend, frontend, n8n, Redis, Prometheus, Grafana.

### Prerequisites

- Docker Desktop must be **running** (check for the whale icon in your menu bar)

### Steps

```bash
cd /path/to/Agent-flow

# 1. Create root .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 2. Build and start everything
docker compose up --build -d

# 3. Check all services are running
docker compose ps
```

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend (Chat UI) | http://localhost:3000 | — |
| Backend API | http://localhost:3001 | — |
| n8n Workflows | http://localhost:5678 | admin / (your N8N_PASSWORD) |
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3002 | admin / (your GRAFANA_PASSWORD) |

### Docker commands

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove all data (volumes)
docker compose down -v

# Restart a single service
docker compose restart backend
```

---

## 9. n8n Workflow Setup

n8n provides a visual workflow builder that acts as an alternative orchestration layer.

### Step 1: Access n8n

- If using Docker: go to http://localhost:5678
- If running standalone: `npx n8n` (installs and runs n8n)

### Step 2: Import the workflow

1. In n8n, click **"..." menu** → **"Import from File"**
2. Select `Agent-flow/n8n/workflow.json`
3. Click **"Import"**

### Step 3: Configure credentials

1. In the workflow, click the **"OpenAI Agent"** node
2. Add your API credentials (you can use the Gemini-compatible endpoint or OpenAI)
3. Save

### Step 4: Activate the workflow

1. Toggle the **"Active"** switch in the top-right corner
2. The webhook will be available at: `http://localhost:5678/webhook/ai-agent`

### Step 5: Test it

```bash
curl -X POST http://localhost:5678/webhook/ai-agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze my resume", "userId": "user-1"}'
```

### Workflow nodes explained

```
Webhook → Validate Input → Fetch Memory → AI Agent → Parse Response
                                                          │
                                               ┌──────────┴──────────┐
                                               │                     │
                                          Tool Call?              Direct Response
                                               │                     │
                                    ┌──────────┴──────────┐         │
                                    │    Tool Router       │         │
                                    │  (get/analyze/       │         │
                                    │   improve/save)      │         │
                                    └──────────┬──────────┘         │
                                               │                    │
                                         Format Response ◄──────────┘
                                               │
                                          Log & Respond
```

---

## 10. Using the Chat UI

### Sending messages

1. Open http://localhost:3000
2. Type a message in the text box
3. Press **Enter** to send (or click the **➤** button)
4. Use **Shift + Enter** for a new line

### Quick actions (suggestion chips)

Click any of the pre-built suggestions on the welcome screen:

| Button | What it does |
|--------|-------------|
| "View my resume" | Fetches and displays your resume data |
| "Analyze my resume" | Gets a score and detailed feedback |
| "Improve my summary" | AI suggests improvements for your summary |
| "Skill suggestions" | Recommends skills based on your target role |

### Example conversations

**Viewing your resume:**
```
You: Show me my resume
AI: Here's your resume for John Doe...
    [displays formatted resume data]
```

**Getting analysis:**
```
You: Analyze my resume and score it
AI: I've analyzed your resume. Here are the results:
    Overall Score: 78/100
    ✅ Summary: 85/100 — Good length and content
    ✅ Experience: 90/100 — Strong quantified achievements
    ⚠️ Skills: 70/100 — Consider adding more skills
    ...
```

**Improving a section:**
```
You: How can I improve my experience section for a senior engineer role?
AI: Here are specific suggestions:
    1. Use stronger action verbs (Led, Architected, Spearheaded)
    2. Quantify more achievements with numbers
    ...
```

### Starting a new conversation

Click the **"New Chat"** button in the top-right corner. This clears the current conversation and starts fresh.

---

## 11. Voice Assistant

The chat UI includes built-in voice support using the Web Speech API.

### Speech-to-Text (Voice Input)

1. Click the **🎤 microphone button** next to the text input
2. Speak your message
3. The button will pulse red while listening
4. When you stop speaking, the text appears in the input box
5. The message is automatically sent to the AI

### Text-to-Speech (AI reads response)

1. After the AI responds, click the **🔊 speaker button** on the message
2. The AI's response will be read aloud
3. Click again to stop

### Browser support

| Browser | Speech-to-Text | Text-to-Speech |
|---------|---------------|----------------|
| Chrome | ✅ Full support | ✅ Full support |
| Edge | ✅ Full support | ✅ Full support |
| Safari | ✅ Partial | ✅ Full support |
| Firefox | ❌ Not supported | ✅ Full support |

If your browser doesn't support speech-to-text, the microphone button will not appear.

---

## 12. API Reference

### Authentication

In development mode, pass `X-User-Id` header:
```
X-User-Id: user-1
```

In production, use JWT tokens:
```bash
# Get a token
curl -X POST http://localhost:3001/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-1"}'

# Use the token
curl http://localhost:3001/api/chat \
  -H "Authorization: Bearer <your-token>"
```

### Endpoints

#### `POST /api/chat` — Send a message

**Request:**
```json
{
  "message": "Hello, analyze my resume",
  "threadId": "thread-xxx",    // optional, auto-generated if omitted
  "stream": false              // set true for SSE streaming
}
```

**Response (non-streaming):**
```json
{
  "success": true,
  "data": {
    "response": "I'd be happy to analyze your resume...",
    "threadId": "thread-abc123",
    "usage": { "model": "gemini-2.0-flash" }
  }
}
```

**Response (streaming, `stream: true`):**
```
Content-Type: text/event-stream

data: {"type":"token","content":"I'd"}
data: {"type":"token","content":" be"}
data: {"type":"token","content":" happy"}
...
data: {"type":"done","threadId":"thread-abc123"}
```

#### `GET /api/chat/history/:threadId` — Get conversation history

```json
{
  "success": true,
  "data": {
    "threadId": "thread-abc123",
    "messages": [
      { "role": "user", "content": "Hello", "timestamp": 1234567890 },
      { "role": "assistant", "content": "Hi! How can I help?", "timestamp": 1234567891 }
    ]
  }
}
```

#### `DELETE /api/chat/history/:threadId` — Clear conversation

#### `GET /api/resume/:userId` — Get resume data

#### `POST /api/resume/save` — Save/update resume

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "skills": ["JavaScript", "React"],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Senior Developer",
      "duration": "2021 - Present",
      "highlights": ["Led team of 5", "Reduced latency by 40%"]
    }
  ]
}
```

#### `GET /health` — Health check

#### `GET /health/metrics` — Prometheus metrics

#### WebSocket: `ws://localhost:3001/ws`

**Send:**
```json
{ "message": "Hello", "userId": "user-1", "threadId": "thread-xxx" }
```

**Receive:**
```json
{ "type": "thread", "threadId": "thread-xxx" }
{ "type": "token", "content": "Hello" }
{ "type": "token", "content": "! How" }
{ "type": "done", "threadId": "thread-xxx" }
```

---

## 13. Testing

### Run all tests

```bash
cd backend
npm test
```

### Expected output

```
PASS tests/tools.test.js
PASS tests/api.test.js

Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
```

### What's tested

**tools.test.js (10 tests):**
- get_resume — returns data for existing user
- get_resume — returns error for non-existent user
- analyze_resume — scores a complete resume
- analyze_resume — flags missing sections
- analyze_resume — detects missing contact info
- improve_resume — suggests summary improvements
- improve_resume — suggests experience improvements
- improve_resume — tailors suggestions to target role
- save_resume — saves new resume
- save_resume — updates existing resume

**api.test.js (7 tests):**
- GET /health — returns healthy status
- POST /api/auth/token — generates JWT token
- POST /api/auth/token — rejects missing userId
- GET /api/resume/:userId — returns resume for existing user
- GET /api/resume/:userId — returns 404 for missing user
- POST /api/resume/save — saves resume data
- POST /api/resume/save — rejects invalid email format

### Manual API testing

```bash
# Test the full AI chat flow
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-1" \
  -d '{"message": "Analyze my resume"}'

# Test streaming
curl -N -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-1" \
  -d '{"message": "Hello", "stream": true}'
```

---

## 14. Monitoring & Metrics

### Prometheus metrics (available at `/health/metrics`)

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Duration of all HTTP requests |
| `chat_requests_total` | Counter | Total chat requests by status |
| `active_websocket_connections` | Gauge | Current WebSocket connections |
| `ai_response_time_seconds` | Histogram | Time for AI to generate responses |
| `tool_calls_total` | Counter | Tool calls by name and status |

### Viewing metrics

**Without Docker:**
```bash
curl http://localhost:3001/health/metrics
```

**With Docker (Grafana):**
1. Open http://localhost:3002
2. Login: admin / (your GRAFANA_PASSWORD)
3. Add Prometheus data source: `http://prometheus:9090`
4. Create dashboards using the metrics above

### Log files

```
backend/logs/
├── combined.log    # All logs
└── error.log       # Errors only
```

---

## 15. Troubleshooting

### "GEMINI_API_KEY is not set"
→ Make sure `backend/.env` exists and contains `GEMINI_API_KEY=your-key`

### "429 Too Many Requests / quota exceeded"
→ Your Gemini free tier daily quota is exhausted.
**Fix:** Wait 24 hours, OR create a new API key from a different Google Cloud project at https://aistudio.google.com/apikey, OR enable billing at https://console.cloud.google.com/billing

### "models/gemini-xxx is not found"
→ The model name in `.env` is wrong.
**Fix:** Use `GEMINI_MODEL=gemini-2.0-flash` (this is the current free-tier model)

### "EADDRINUSE: address already in use :::3001"
→ Another process is using port 3001.
**Fix:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
# Then restart
npm run dev
```

### "Redis not available — using in-memory storage"
→ This is a **warning, not an error**. The app works fine without Redis. Chat history just resets when the server restarts.
**To use Redis:** Install and start Redis:
```bash
brew install redis    # macOS
brew services start redis
```

### Frontend shows "An error occurred"
→ Check the backend terminal for the actual error. Common causes:
- API key issue (invalid or quota exceeded)
- Backend not running on port 3001
- CORS mismatch (check `CORS_ORIGIN` in `.env`)

### "Validation failed: threadId"
→ This was fixed in the code. If it appears, make sure you're running the latest code.

### Chat works via curl but not from the UI
→ Check browser console (F12 → Console) for CORS errors.
**Fix:** Ensure `CORS_ORIGIN=http://localhost:3000` in `backend/.env`

---

## 16. Production Deployment

### Environment checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use a strong random `JWT_SECRET` (at least 32 characters)
- [ ] Set up proper CORS origin (your domain, not localhost)
- [ ] Enable Redis for persistent memory
- [ ] Set appropriate rate limits
- [ ] Enable billing on your Gemini API account
- [ ] Set `LOG_LEVEL=warn` to reduce log volume

### Deploy with Docker

```bash
# Build production images
docker compose -f docker-compose.yml up --build -d

# Verify all services are healthy
docker compose ps
```

### Deploy to cloud (example: Railway, Render, or DigitalOcean)

**Backend:**
1. Push to GitHub
2. Connect your repo to Railway/Render
3. Set the root directory to `backend`
4. Set environment variables from `.env`
5. Deploy

**Frontend:**
1. Build: `cd frontend && npm run build`
2. Deploy the `build/` folder to Vercel, Netlify, or any static host
3. Set `REACT_APP_API_URL` to your backend URL

### Security checklist

- [ ] All API keys are in `.env` files, never in code
- [ ] `.env` is in `.gitignore` (already configured)
- [ ] Rate limiting is enabled
- [ ] CORS is restricted to your domain
- [ ] JWT tokens expire (default: 24 hours)
- [ ] HTTPS is enabled in production
- [ ] Helmet.js headers are active (already configured)

---

## Quick Start Summary

```bash
# 1. Clone and enter the project
cd Agent-flow

# 2. Set up backend
cd backend
cp .env.example .env
# Edit .env → add your GEMINI_API_KEY
npm install
npm run dev
# Backend runs on http://localhost:3001

# 3. Open new terminal — set up frontend
cd frontend
npm install
npm start
# Frontend opens at http://localhost:3000

# 4. Open http://localhost:3000 and start chatting!
```

**That's it.** Two terminals, two commands, and you have a working AI agent system.
