# Voice Email Agent

A production-ready Voice AI Agent that converts spoken commands into professional emails using **Groq LLM**, **n8n workflow automation**, and **Gmail API**.

**Example:** Say _"Send an email to HR saying I will be on leave tomorrow"_ and the system drafts, confirms, and sends the email.

---

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────────┐
│  React App   │───▶│  Node.js API │───▶│  n8n Workflow Engine              │
│              │    │              │    │                                    │
│ Voice Input  │    │ Validation   │    │  Webhook ─▶ Groq LLM ─▶ Parse   │
│ (Web Speech) │    │ Rate Limit   │    │  ─▶ IF (email?) ─▶ Gmail Send   │
│              │◀───│              │◀───│                                    │
│ Voice Output │    │ Proxy        │    │  Returns draft for confirmation   │
│ (TTS)        │    │              │    │                                    │
└──────────────┘    └──────────────┘    └──────────────────────────────────┘
```

### Flow

1. **User speaks** → Web Speech API converts to text
2. **Frontend** sends text to backend API
3. **Backend** validates and forwards to n8n webhook
4. **n8n Workflow 1** (Voice Agent):
   - Extracts input → Calls Groq API (llama3-70b-8192) → Parses response → Routes by intent
   - Returns email draft with `requiresConfirmation: true`
5. **Frontend** shows email preview with Edit/Send/Cancel
6. **User confirms** → Backend calls n8n second webhook
7. **n8n Workflow 2** (Send Email):
   - Verifies confirmation → Sends via Gmail API → Returns success
8. **Frontend** speaks the result using SpeechSynthesis API

---

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Frontend    | React 18, Web Speech API, SpeechSynthesis API |
| Backend     | Node.js, Express, Helmet, Joi |
| AI/LLM      | Groq API (llama3-70b-8192) |
| Automation  | n8n (self-hosted)       |
| Email       | Gmail API (OAuth2)      |
| Deployment  | Docker Compose          |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Groq API key ([console.groq.com](https://console.groq.com))
- Google Cloud project with Gmail API enabled

### 1. Clone & Configure

```bash
cd Email-Agent
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start n8n

```bash
docker compose up n8n -d
# Open http://localhost:5678
```

### 3. Import n8n Workflows

1. Open n8n at `http://localhost:5678`
2. Go to **Workflows → Import from File**
3. Import `n8n/voice-agent-workflow.json` (processes voice commands)
4. Import `n8n/send-email-workflow.json` (sends confirmed emails)
5. **Activate both workflows**

### 4. Configure n8n Credentials

#### Groq API (HTTP Header Auth)
1. In n8n: **Settings → Credentials → Add Credential**
2. Type: **Header Auth**
3. Name: `Authorization`, Value: `Bearer gsk_YOUR_GROQ_KEY`
4. Assign to the "Groq LLM" node in the Voice Agent workflow

#### Gmail OAuth2
1. In Google Cloud Console:
   - Enable Gmail API
   - Create OAuth2 credentials (Web Application)
   - Add redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`
2. In n8n: **Settings → Credentials → Add Credential → Gmail OAuth2**
3. Enter Client ID and Client Secret
4. Click "Sign in with Google" to authorize
5. Assign to the "Gmail - Send Email" node in the Send Email workflow

### 5. Start Backend & Frontend

```bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start both (from project root)
npm install
npm run start:dev
```

Or individually:
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm start
```

### 6. Open the App

Open `http://localhost:3000` in Chrome (best speech recognition support).

---

## Docker Deployment

```bash
docker compose up -d
```

This starts n8n (:5678), backend (:3001), and frontend (:3000).

---

## Project Structure

```
Email-Agent/
├── frontend/                  # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceButton.js      # Mic button with listening state
│   │   │   ├── ChatWindow.js       # Message history display
│   │   │   ├── EmailConfirmation.js # Draft preview with edit/send/cancel
│   │   │   └── StatusBar.js        # Processing status indicator
│   │   ├── hooks/
│   │   │   ├── useVoice.js         # Web Speech API (STT)
│   │   │   └── useSpeech.js        # SpeechSynthesis API (TTS)
│   │   ├── services/
│   │   │   └── api.js              # Backend API client
│   │   ├── styles/
│   │   │   ├── index.css           # Base styles
│   │   │   └── App.css             # Component styles
│   │   ├── App.js                  # Main app with state management
│   │   └── index.js                # Entry point
│   └── public/
├── backend/                   # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── agent.js            # /api/agent/message & /confirm
│   │   │   └── health.js           # Health check
│   │   ├── services/
│   │   │   └── n8nClient.js        # n8n webhook client
│   │   ├── utils/
│   │   │   ├── logger.js           # Winston logger
│   │   │   └── validators.js       # Email validation
│   │   └── server.js               # Express server
│   └── tests/
│       └── agent.test.js           # API tests
├── n8n/                       # Workflow definitions
│   ├── voice-agent-workflow.json   # AI processing pipeline
│   └── send-email-workflow.json    # Email sending pipeline
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/agent/message` | Send voice text for AI processing |
| POST | `/api/agent/confirm` | Confirm or cancel email sending |

### POST /api/agent/message
```json
{ "text": "Send email to HR about leave", "sessionId": "session_123" }
```

### POST /api/agent/confirm
```json
{
  "sessionId": "session_123",
  "confirmed": true,
  "emailData": {
    "to": "hr@company.com",
    "subject": "Leave Request",
    "body": "Dear HR, I will be on leave tomorrow."
  }
}
```

---

## Testing

```bash
cd backend
npm test
```

### Manual Voice Test
1. Open `http://localhost:3000` in Chrome
2. Click the microphone button
3. Say: "Send an email to john@example.com saying the project is complete"
4. Verify the AI drafts a professional email
5. Click Send or Cancel
6. Verify voice output confirms the action

### Error Scenarios to Test
- Speak with no intent → should get a chat response
- Invalid email address → should show validation error
- n8n offline → should show "Failed to process" error
- Network timeout → should show retry message

---

## Security

- **Confirmation required** before any email is sent
- **Rate limiting**: 30 requests/minute per IP
- **Input validation**: Joi schema on all endpoints
- **Helmet**: Security headers on all responses
- **CORS**: Restricted to frontend origin
- **No secrets in code**: All credentials in `.env` or n8n credential store

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Microphone not working | Use Chrome, allow mic permission |
| n8n webhook 404 | Ensure workflows are **activated** |
| Gmail auth error | Re-authorize OAuth2 in n8n credentials |
| Groq timeout | Check API key, increase timeout in n8n node |
| CORS error | Verify `FRONTEND_URL` in backend `.env` |
