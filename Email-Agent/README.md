<div align="center">

# 🎙️ Tamil AI Voice Agent

### Your AI-Powered Voice Assistant — Email & WhatsApp

<br/>

```
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║   🗣️  "Hey Agent, send a WhatsApp to John saying I'm late"  ║
  ║                                                              ║
  ║         ↓  Voice  →  AI  →  Draft  →  Confirm  →  Sent!     ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
```

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Groq](https://img.shields.io/badge/Groq_LLM-llama3.3--70b-F55036?style=for-the-badge)
![Gmail](https://img.shields.io/badge/Gmail-SMTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio-WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

</div>

---

## ⚡ What It Does

Speak naturally, and the AI agent handles the rest — draft, confirm, and send emails or WhatsApp messages entirely by voice.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   You:   "Send an email to HR saying I'll be on leave tomorrow" │
│                                                                 │
│   Agent: "Got it! Here's your email draft..."                   │
│          📧 To: hr@company.com                                  │
│          📝 Subject: Leave Request                              │
│          📄 Body: Dear HR, I will be on leave tomorrow...       │
│                                                                 │
│   Agent: "Shall I send it? Say Yes or No."                      │
│   You:   "Yes, send it"                                         │
│                                                                 │
│   Agent: "Done! Email sent to hr@company.com!"                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Features

### Core
| Feature | Description |
|---------|-------------|
| 🗣️ **Voice-First** | Full conversation via Web Speech API — speak to compose, confirm, and send |
| 🤖 **AI Intent Detection** | Groq LLM (llama-3.3-70b) understands "send email" vs "send WhatsApp" |
| 📧 **Gmail SMTP** | Sends real emails via Nodemailer with Gmail App Password |
| 💬 **WhatsApp via Twilio** | Sends WhatsApp messages through Twilio sandbox/production |
| 🔊 **Text-to-Speech** | Agent speaks back every response with natural voice selection |
| 🎨 **Animated Pipeline** | Live SVG visualization of the AI agent pipeline (purple=email, green=WhatsApp) |

### v2.0 — Smart Features
| Feature | Description |
|---------|-------------|
| ✨ **AI Smart Compose** | One-click AI enhancement — makes emails professional, WhatsApp casual |
| 🌊 **Animated Sound Waves** | SVG equalizer bars + expanding ring animation when listening |
| 📇 **Contact Book** | Save contacts by voice — "save contact John", "send to John" |
| 📋 **Message Templates** | 6 pre-built templates — "use running late template" |
| 🎤 **"Hey Agent" Wake Word** | Always-on passive listening — say "Hey Agent" to activate |
| 🔁 **Read Back** | "Read back my message" — agent reads your draft aloud before sending |
| ⌨️ **Text Fallback** | Type responses when voice isn't convenient |
| 💤 **Idle Nudge** | Agent prompts you if silent too long — with personality & jokes |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 18)                         │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  Voice   │  │ Conversation │  │  Pipeline  │  │   Contact   │  │
│  │  Button  │  │  Flow State  │  │  Canvas    │  │   Book &    │  │
│  │  + Waves │  │  Machine     │  │  (SVG)     │  │   Templates │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └─────────────┘  │
│       │               │                │                            │
│  ┌────▼─────┐  ┌──────▼───────┐  ┌─────▼──────┐                   │
│  │ useVoice │  │  useSpeech   │  │ useIdle    │                   │
│  │ (STT)    │  │  (TTS)       │  │ Nudge      │                   │
│  └────┬─────┘  └──────────────┘  └────────────┘                   │
│       │                                                             │
└───────┼─────────────────────────────────────────────────────────────┘
        │  HTTP POST
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js + Express)                   │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  Agent   │  │  Groq LLM   │  │   Gmail    │  │   Twilio    │  │
│  │  Routes  │──│  Client      │  │   SMTP     │  │   WhatsApp  │  │
│  │          │  │              │  │   Service  │  │   Service   │  │
│  └──────────┘  └──────────────┘  └────────────┘  └─────────────┘  │
│                                                                     │
│  Security: Helmet │ CORS │ Rate Limit (30/min) │ Joi Validation    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Groq API Key** → [console.groq.com](https://console.groq.com)
- **Gmail App Password** → [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)
- **Twilio Account** (for WhatsApp) → [twilio.com](https://www.twilio.com)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Email-Agent

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# AI
GROQ_API_KEY=gsk_your_groq_api_key

# Gmail
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. Start the App

```bash
# Terminal 1 — Backend
cd backend && node src/server.js

# Terminal 2 — Frontend
cd frontend && npm start
```

### 4. Open & Use

Open **http://localhost:3000** in Chrome (best speech recognition support).

```
┌──────────────────────────────────────────┐
│                                          │
│   1. Click "Tap to Start"               │
│   2. Agent greets you with voice        │
│   3. Say "WhatsApp" or "Email"          │
│   4. Follow the guided voice flow       │
│   5. Review, edit, or AI-enhance draft  │
│   6. Confirm → Message sent!            │
│                                          │
│   After sending, say "Hey Agent"        │
│   to start a new conversation.          │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🎤 Voice Commands

### Conversation Flow
| Say This | What Happens |
|----------|--------------|
| `"WhatsApp"` or `"Email"` | Selects channel |
| `"john at gmail dot com"` | Sets email recipient (speech-cleaned) |
| `"plus 91 9876543210"` | Sets WhatsApp recipient |
| `"Yes"` / `"Send it"` | Confirms and sends |
| `"No"` / `"Edit"` | Opens edit options |
| `"Start over"` / `"Reset"` | Restarts the flow |

### Smart Commands
| Say This | What Happens |
|----------|--------------|
| `"Hey Agent"` | Wakes the agent from sleep |
| `"Read back"` | Agent reads your composed message aloud |
| `"Use running late template"` | Applies a pre-built template |
| `"List templates"` | Shows available templates |
| `"Save contact John"` | Saves current recipient as "John" |
| `"Send to John"` | Looks up John in contacts |

### Available Templates
| Template | Email Subject | Use Case |
|----------|--------------|----------|
| `running late` | Running Late | Quick delay notification |
| `leave request` | Leave Request | Formal leave application |
| `meeting reminder` | Meeting Reminder | Team meeting heads-up |
| `thank you` | Thank You | Gratitude message |
| `follow up` | Follow Up | Check-in on pending items |
| `sick leave` | Sick Leave Notification | Sick day notification |

---

## 📁 Project Structure

```
Email-Agent/
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── agent.js              # /message, /confirm, /smart-compose
│       │   └── health.js             # Health check endpoint
│       ├── services/
│       │   ├── groqClient.js         # Groq LLM — intent detection + smart compose
│       │   ├── emailService.js       # Gmail SMTP via Nodemailer
│       │   ├── whatsappService.js    # Twilio WhatsApp API
│       │   └── n8nClient.js          # Optional n8n webhook client
│       ├── utils/
│       │   ├── logger.js             # Winston logger
│       │   └── validators.js         # Email & phone validation
│       └── server.js                 # Express app + security middleware
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── AgentFlowCanvas.js    # Animated SVG pipeline (email/WhatsApp)
│       │   ├── AgentNode.js          # Pipeline node with icons & animations
│       │   ├── VoiceButton.js        # Mic button + sound wave visualizer
│       │   ├── ChatWindow.js         # Message history display
│       │   ├── EmailConfirmation.js  # Draft card with AI Enhance button
│       │   ├── StatusBar.js          # Status: Listening / Thinking / Passive
│       │   └── TextInput.js          # Text fallback input
│       ├── hooks/
│       │   ├── useVoice.js           # Web Speech STT + wake word detection
│       │   ├── useSpeech.js          # SpeechSynthesis TTS + voice selection
│       │   ├── useConversationFlow.js # State machine (12 steps)
│       │   └── useIdleNudge.js       # 12s idle timeout with personality
│       ├── utils/
│       │   ├── contacts.js           # localStorage contact book
│       │   ├── templates.js          # 6 pre-built message templates
│       │   └── personality.js        # Quips, jokes, nudges
│       ├── services/
│       │   └── api.js                # Backend API client
│       ├── styles/
│       │   ├── App.css               # All component styles + animations
│       │   └── index.css             # Base styles
│       └── App.js                    # Main orchestrator
│
└── .env                              # API keys & credentials
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/agent/message` | Send text for AI processing |
| `POST` | `/api/agent/confirm` | Confirm & send email or WhatsApp |
| `POST` | `/api/agent/smart-compose` | AI-enhance a message draft |

### POST `/api/agent/confirm`
```json
{
  "sessionId": "session_123",
  "confirmed": true,
  "type": "whatsapp",
  "emailData": {
    "to": "+919876543210",
    "body": "Hey! I'm running late, be there in 10 mins."
  }
}
```

### POST `/api/agent/smart-compose`
```json
{
  "body": "hey can u send me the report",
  "subject": "Report",
  "type": "email"
}
// Returns: { enhanced: "Dear Team, Could you please share...", changes: "Made professional" }
```

---

## 🧠 Conversation State Machine

The guided voice flow uses a 12-step state machine:

```
                    ┌───────────┐
                    │   IDLE    │ ← "Hey Agent" wakes from here
                    └─────┬─────┘
                          │ click / wake word
                    ┌─────▼─────┐
                    │ GREETING  │ "Good morning! How can I help?"
                    └─────┬─────┘
                          │
                    ┌─────▼──────────┐
                    │ AWAITING_TYPE  │ "WhatsApp or Email?"
                    └──┬──────────┬──┘
                       │          │
           ┌───────────▼┐   ┌────▼──────────┐
           │WA_RECIPIENT│   │ EM_RECIPIENT  │
           └─────┬──────┘   └──────┬────────┘
                 │                 │
           ┌─────▼──────┐   ┌─────▼────────┐
           │ WA_MESSAGE │   │  EM_SUBJECT  │
           └─────┬──────┘   └──────┬───────┘
                 │                 │
           ┌─────▼──────┐   ┌─────▼────────┐
           │ WA_CONFIRM │   │   EM_BODY    │
           └─────┬──────┘   └──────┬───────┘
                 │                 │
                 │           ┌─────▼────────┐
                 │           │  EM_CONFIRM  │
                 │           └──────┬───────┘
                 │                  │
                 └────────┬─────────┘
                    ┌─────▼─────┐
                    │  SENDING  │ → Gmail SMTP / Twilio API
                    └─────┬─────┘
                    ┌─────▼─────┐
                    │   DONE    │ → "Anything else?" → passive listening
                    └───────────┘
```

---

## 🔒 Security

| Layer | Protection |
|-------|-----------|
| **Rate Limiting** | 30 requests/minute per IP |
| **Input Validation** | Joi schemas on all endpoints |
| **Security Headers** | Helmet middleware |
| **CORS** | Restricted to frontend origin |
| **Credentials** | All secrets in `.env` (never in code) |
| **Confirmation** | User must confirm before any message is sent |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Microphone not working | Use **Chrome**, allow mic permission, check `chrome://settings/content/microphone` |
| Voice not speaking | Click anywhere on the page first (browser requires user gesture for audio) |
| "Hey Agent" not working | Complete a conversation first — wake word activates after flow ends |
| WhatsApp not delivered | Join Twilio sandbox: send `join <your-code>` to `+14155238886` on WhatsApp |
| Gmail auth error | Use an **App Password**, not your regular password. Enable 2FA first. |
| CORS error | Verify `FRONTEND_URL=http://localhost:3000` in `.env` |
| Groq timeout | Check API key at [console.groq.com](https://console.groq.com) |

---

## 🛠️ Tech Stack

```
┌──────────────┬────────────────────────────────────┐
│  Layer       │  Technology                        │
├──────────────┼────────────────────────────────────┤
│  Frontend    │  React 18, Web Speech API, TTS     │
│  Backend     │  Node.js, Express, Helmet, Joi     │
│  AI / LLM    │  Groq API (llama-3.3-70b)          │
│  Email       │  Nodemailer + Gmail SMTP            │
│  WhatsApp    │  Twilio Programmable Messaging      │
│  Automation  │  n8n (optional, self-hosted)        │
│  Storage     │  localStorage (contacts/templates)  │
└──────────────┴────────────────────────────────────┘
```

---

<div align="center">

**Built with ❤️ by Tamil** · Powered by Groq LLM + React + Node.js

</div>
