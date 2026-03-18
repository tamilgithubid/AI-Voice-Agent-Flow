# AI Agent Flow — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  React Web   │  │  Mobile App  │  │  API Client  │              │
│  │  (Chat UI)   │  │  (Future)    │  │  (REST)      │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                      │
│         └──────────────────┼──────────────────┘                     │
│                            │                                         │
│                    ┌───────▼────────┐                                │
│                    │  API Gateway   │                                │
│                    │  (Node.js)     │                                │
│                    │  Port: 3001    │                                │
│                    └───────┬────────┘                                │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                               │
│                    ┌───────▼────────┐                                │
│                    │  n8n Workflow  │                                │
│                    │  Engine        │                                │
│                    │  Port: 5678   │                                │
│                    └───────┬────────┘                                │
│                            │                                         │
│              ┌─────────────┼─────────────────┐                      │
│              │             │                  │                      │
│      ┌───────▼──────┐ ┌───▼──────┐  ┌───────▼──────┐              │
│      │  OpenAI API  │ │  Tool    │  │  Memory      │              │
│      │  (GPT-4)     │ │  Router  │  │  Manager     │              │
│      └──────────────┘ └────┬─────┘  └───────┬──────┘              │
│                            │                  │                      │
│              ┌─────────────┼──────────┐      │                      │
│              │             │          │      │                      │
│      ┌───────▼──┐  ┌──────▼──┐ ┌────▼────┐ │                      │
│      │get_resume│  │analyze  │ │improve  │ │                      │
│      │          │  │_resume  │ │_resume  │ │                      │
│      └──────────┘  └─────────┘ └─────────┘ │                      │
└─────────────────────────────────────────────┼──────────────────────┘
                                              │
┌─────────────────────────────────────────────┼──────────────────────┐
│                    DATA LAYER                │                      │
│                    ┌────────▼───────┐                                │
│                    │     Redis      │                                │
│                    │  (Memory +     │                                │
│                    │   Sessions)    │                                │
│                    │  Port: 6379    │                                │
│                    └────────────────┘                                │
│                                                                      │
│                    ┌────────────────┐                                │
│                    │   PostgreSQL   │                                │
│                    │  (Users +      │                                │
│                    │   Resumes)     │                                │
│                    │  Port: 5432    │                                │
│                    └────────────────┘                                │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    MONITORING & INFRA                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Prometheus   │  │  Grafana     │  │  Loki        │              │
│  │  (Metrics)    │  │  (Dashboards)│  │  (Logs)      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. User sends message via React Chat UI
2. Request hits Node.js API Gateway (auth, rate-limit, validation)
3. Gateway forwards to n8n webhook `/ai-agent`
4. n8n fetches conversation memory from Redis
5. n8n sends context + message to OpenAI GPT-4
6. OpenAI decides: direct response OR tool call
7. If tool call → n8n routes to appropriate tool, executes, returns result to OpenAI
8. OpenAI generates final response
9. n8n saves updated memory to Redis
10. Response streams back to client via SSE

## Multi-Tenant Architecture

- Each user gets isolated conversation threads
- Thread IDs scope all memory operations
- API keys are per-tenant for SaaS mode
- Rate limits are per-user
