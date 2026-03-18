<div align="center">

# Agent Flow AI

### Your Intelligent Resume Assistant Powered by AI Agents

<img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
<img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
<img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />

<br />

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=61DAFB&center=true&vCenter=true&multiline=true&repeat=true&width=600&height=80&lines=AI-Powered+Resume+Analysis;Real-Time+Streaming+%7C+Voice+Assistant;Agentic+Loop+%7C+Tool+Calling+%7C+Memory" alt="Typing SVG" />

<br />

[Features](#-features) &bull; [Architecture](#-architecture) &bull; [Quick Start](#-quick-start) &bull; [API Reference](#-api-reference) &bull; [Monitoring](#-monitoring) &bull; [Deployment](#-deployment)

---

</div>

## What is Agent Flow AI?

Agent Flow AI is a **production-ready, full-stack AI agent system** with a ChatGPT-like interface. It uses an **agentic loop** — the AI model decides when to call tools, executes them, and feeds results back into the conversation — to help users analyze, improve, and manage their resumes through natural language.

<div align="center">

```
 User Message ──> AI Agent ──> Tool Decision ──> Execute Tool ──> Feed Back ──> Response
       ^                                                                          |
       └──────────────────────── Conversation Loop ────────────────────────────────┘
```

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### Conversational AI
- Real-time **streaming responses** (SSE + WebSocket)
- Multi-turn conversations with **persistent memory**
- Agentic loop with **automatic tool calling**
- Thread-based chat with history

</td>
<td width="50%">

### Voice Assistant
- **Speech-to-Text** — talk to your AI assistant
- **Text-to-Speech** — hear responses read aloud
- Browser-native Web Speech API
- Works in Chrome, Edge, Safari

</td>
</tr>
<tr>
<td width="50%">

### Resume Intelligence
- **ATS Compatibility Scoring** — know your resume's strength
- **Section-by-Section Analysis** — detailed feedback
- **Smart Improvements** — AI-generated suggestions
- **Save & Manage** — persist your updated resume

</td>
<td width="50%">

### Production Ready
- **JWT Authentication** with rate limiting
- **Redis** for distributed memory (with in-memory fallback)
- **Prometheus + Grafana** monitoring
- **Docker Compose** one-command deployment

</td>
</tr>
</table>

---

## 🏗 Architecture

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
│                     http://localhost:3000                       │
│                                                                 │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐  │
│   │   Chat   │   │  Voice   │   │ Markdown │   │  Streaming│  │
│   │  Window  │   │  Input   │   │ Renderer │   │   (SSE)   │  │
│   └──────────┘   └──────────┘   └──────────┘   └───────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST / SSE / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                      BACKEND (Express)                          │
│                     http://localhost:3001                        │
│                                                                  │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐   │
│   │   Auth   │   │   Rate   │   │  Agent   │   │   Tools   │   │
│   │   JWT    │   │ Limiter  │   │  Loop    │   │  Engine   │   │
│   └──────────┘   └──────────┘   └──────────┘   └───────────┘   │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼──────┐
│   Redis 7   │ │ Prometheus│ │  Grafana  │ │    n8n     │
│  :6379      │ │  :9090    │ │  :3002    │ │   :5678    │
└─────────────┘ └───────────┘ └───────────┘ └────────────┘
```

</div>

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, React Markdown, Web Speech API | Chat UI, voice, markdown rendering |
| **Backend** | Node.js, Express, WebSocket (ws) | REST API, SSE streaming, real-time |
| **AI Engine** | Google Gemini 2.0 Flash | LLM inference, tool calling |
| **Memory** | Redis 7 / In-Memory Map | Conversation persistence (50 messages, 7-day TTL) |
| **Auth** | JWT + Helmet.js | Token-based auth, security headers |
| **Validation** | Zod | Request schema validation |
| **Monitoring** | Prometheus + Grafana | Metrics, dashboards, alerting |
| **Orchestration** | n8n (optional) | Visual workflow automation |
| **DevOps** | Docker Compose | Multi-service orchestration |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ &nbsp; <img src="https://img.shields.io/badge/node-18%2B-339933?style=flat-square&logo=node.js&logoColor=white" />
- **npm** v9+
- **Docker** (optional, for production) &nbsp; <img src="https://img.shields.io/badge/docker-optional-2496ED?style=flat-square&logo=docker&logoColor=white" />
- **Google Gemini API Key** &nbsp; ([Get one free](https://aistudio.google.com/apikey))

### Option 1: Development (2 Terminals)

```bash
# Clone the repo
git clone https://github.com/tamilgithubid/AI-Resume-Agentflow.git
cd AI-Resume-Agentflow
```

**Terminal 1 — Backend:**

```bash
cd backend
cp .env.example .env
# Edit .env → add your GEMINI_API_KEY
npm install
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm start
```

> Or use the shortcut: `bash scripts/start-dev.sh`

### Option 2: Production (Docker)

```bash
cp .env.example .env
# Edit .env → add your API keys

docker compose up --build -d
```

> Or use the shortcut: `bash scripts/start-prod.sh`

<div align="center">

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `http://localhost:3000` | Chat Interface |
| Backend API | `http://localhost:3001` | REST API |
| n8n | `http://localhost:5678` | Workflow Builder |
| Prometheus | `http://localhost:9090` | Metrics |
| Grafana | `http://localhost:3002` | Dashboards |

</div>

---

## 🔧 Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Model to use |
| `PORT` | No | `3001` | Backend port |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection (falls back to in-memory) |
| `JWT_SECRET` | Yes (prod) | — | Secret for JWT tokens |
| `RATE_LIMIT_MAX_REQUESTS` | No | `30` | Max requests per window |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed frontend origin |

---

## 📡 API Reference

### Authentication

```bash
# Generate a JWT token
curl -X POST http://localhost:3001/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

### Chat

```bash
# Send a message (streaming)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Analyze my resume", "threadId": "thread-1", "stream": true}'
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/token` | Generate JWT token |
| `POST` | `/api/chat` | Send message (supports SSE streaming) |
| `GET` | `/api/chat/history/:threadId` | Fetch conversation history |
| `DELETE` | `/api/chat/history/:threadId` | Clear conversation |
| `GET` | `/api/resume/:userId` | Get user's resume |
| `POST` | `/api/resume/save` | Save/update resume |
| `GET` | `/health` | Health check |
| `GET` | `/health/metrics` | Prometheus metrics |
| `WS` | `ws://localhost:3001/ws` | WebSocket streaming |

---

## 🤖 AI Tools

The agent has access to 4 specialized tools that it calls automatically based on conversation context:

| Tool | Description |
|------|-------------|
| `get_resume` | Fetches the user's current resume data |
| `analyze_resume` | Scores ATS compatibility, provides section-by-section feedback |
| `improve_resume` | Generates targeted improvement suggestions |
| `save_resume` | Persists updated resume data |

**How the Agentic Loop Works:**

```
1. User sends message
2. AI decides: respond directly OR call a tool
3. If tool call → execute tool → feed result back to AI
4. AI generates final response (max 5 iterations)
5. Response streamed back token-by-token
```

---

## 📊 Monitoring

Built-in observability with **Prometheus** and **Grafana**:

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request latency |
| `chat_requests_total` | Counter | Chat requests by status |
| `active_websocket_connections` | Gauge | Current WebSocket connections |
| `ai_response_time_seconds` | Histogram | AI generation time |
| `tool_calls_total` | Counter | Tool usage by name/status |

Access Grafana at `http://localhost:3002` (default login: `admin` / your configured password).

---

## 🐳 Deployment

### Docker Compose Services

```yaml
services:
  backend       # Node.js API (port 3001)
  frontend      # React app via Nginx (port 3000)
  redis         # Session & memory store (port 6379)
  n8n           # Workflow automation (port 5678)
  prometheus    # Metrics collection (port 9090)
  grafana       # Metrics dashboards (port 3002)
```

### Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Enable Gemini API billing for production traffic
- [ ] Set `NODE_ENV=production`
- [ ] Use Redis for persistent memory
- [ ] Configure `CORS_ORIGIN` to your domain
- [ ] Set `LOG_LEVEL=warn`
- [ ] Enable HTTPS via reverse proxy
- [ ] Store `.env` securely (never commit to git)

---

## 🧪 Testing

```bash
cd backend

# Run all tests with coverage
npm test

# Watch mode
npm run test:watch
```

---

## 📂 Project Structure

```
Agent-flow/
├── backend/
│   └── src/
│       ├── config/           # Environment configuration
│       ├── middleware/        # Auth, rate limiting, validation
│       ├── routes/           # API endpoints
│       ├── services/         # Agent logic, tools, Redis
│       ├── utils/            # Logger, metrics
│       └── server.js         # Entry point
├── frontend/
│   └── src/
│       ├── components/       # ChatWindow, ChatMessage, ChatInput
│       ├── hooks/            # useChat, useVoice
│       ├── services/         # API client (REST + SSE + WS)
│       └── styles/           # Dark theme CSS
├── monitoring/
│   └── prometheus.yml        # Scrape configuration
├── n8n/
│   └── workflow.json         # Importable workflow
├── scripts/
│   ├── start-dev.sh          # Development startup
│   └── start-prod.sh         # Production startup
├── docker-compose.yml        # Full stack orchestration
├── .env.example              # Environment template
└── GUIDE.md                  # Detailed setup guide
```

---

<div align="center">

### Built with

<img src="https://skillicons.dev/icons?i=react,nodejs,express,redis,docker,prometheus,grafana&theme=dark" alt="Tech Stack Icons" />

<br /><br />

<img src="https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge" alt="Made with love" />

<br />

If you found this project helpful, give it a star!

<img src="https://img.shields.io/github/stars/tamilgithubid/AI-Resume-Agentflow?style=social" alt="GitHub Stars" />

</div>

# AI-Voice-Agent-Flow