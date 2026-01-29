# Vapi Agent-on-Agent Conversation System

A system for programmatically initiating AI agent-on-agent phone conversations via Vapi, capturing call outcomes via webhooks, and storing conversation data in Neon Postgres.

## Overview

This system allows you to:
- Run experiments with two AI phone agents having conversations
- Track 100+ different conversation topics/scenarios
- Capture voice models, transcripts, and costs for each call
- Store all data in a Postgres database for analysis

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│    Phone A      │────────▶│    Phone B      │
│   (outbound)    │  call   │   (inbound)     │
│   Assistant A   │         │   Assistant B   │
└─────────────────┘         └─────────────────┘
        │                          │
        │ webhook                  │ webhook
        ▼                          ▼
┌─────────────────────────────────────────────┐
│           Webhook Server (Hono)             │
│    - Receives end-of-call-report events     │
│    - Extracts voice model, transcript       │
│    - Saves to database                      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│             Neon Postgres DB                │
│    - experiments table                      │
│    - calls table (voice, topic, etc.)       │
└─────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
- `DATABASE_URL` - Neon Postgres connection string
- `VAPI_API_KEY` - Your Vapi API key
- `PHONE_A_ID`, `PHONE_B_NUMBER` - Vapi phone numbers
- `ASSISTANT_A_ID`, `ASSISTANT_B_ID` - Vapi assistant IDs

### 3. Run Database Migration

```bash
npm run db:migrate
```

### 4. Start the Webhook Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build && npm start
```

### 5. Deploy & Configure Vapi

See [VAPI_SETUP.md](./VAPI_SETUP.md) for detailed Vapi configuration instructions.

Your webhook URL should be: `https://your-domain.com/webhook/vapi`

### 6. Run Conversations

```bash
# Preview what calls will be made (dry run)
npm run orchestrate -- --dry-run

# Run first 5 topics
npm run orchestrate -- --limit=5

# Run a specific topic
npm run orchestrate -- --topic=billing_inquiry

# Run all 100 topics
npm run orchestrate
```

## Project Structure

```
phone-calls/
├── src/
│   ├── server/
│   │   ├── index.ts          # Hono server entry
│   │   └── webhooks.ts       # Vapi webhook handlers
│   ├── orchestrator/
│   │   ├── index.ts          # Call orchestration script
│   │   └── topics.ts         # 100 topic configurations
│   ├── db/
│   │   ├── schema.sql        # Database schema
│   │   ├── client.ts         # Neon client setup
│   │   ├── migrate.ts        # Migration script
│   │   └── queries.ts        # Database queries
│   └── types/
│       └── vapi.ts           # Vapi type definitions
├── VAPI_SETUP.md             # Vapi dashboard setup guide
├── .env.example              # Environment template
├── package.json
└── tsconfig.json
```

## Topic Categories

The system includes 100 conversation topics across 11 categories:

| Category | Topics | Examples |
|----------|--------|----------|
| Customer Service | 20 | Billing, cancellations, refunds |
| Sales | 20 | Insurance, real estate, B2B |
| Healthcare | 10 | Appointments, prescriptions |
| Hospitality | 10 | Hotels, flights, restaurants |
| Professional Services | 10 | Legal, accounting, IT |
| Tech Support | 10 | Internet, software, smart home |
| Government/Utilities | 10 | DMV, permits, utilities |
| Miscellaneous | 10 | Moving, tutoring, events |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Health with DB status |
| `/webhook/vapi` | POST | Vapi webhook receiver |
| `/api/calls` | GET | List recorded calls |
| `/api/stats` | GET | Call statistics |
| `/api/experiments` | GET | List experiments |

## Data Captured

For each call, the system captures:

- **Voice Model Info**: Provider (ElevenLabs, Azure, etc.) and voice ID
- **Model Info**: LLM provider and model name
- **Prompts**: The system prompts used for both agents
- **Transcript**: Full conversation transcript
- **Recording**: URL to the audio recording
- **Cost**: Breakdown of call costs
- **Metadata**: Topic, experiment ID, duration, status

## Deployment Options

### Railway
```bash
railway up
```

### Render
Connect your GitHub repo and set environment variables.

### Fly.io
```bash
fly launch
fly secrets set DATABASE_URL=...
fly deploy
```

### Vercel (Edge Functions)
Note: May need adaptation for Vercel's edge runtime.

## Cost Considerations

Vapi charges for:
- Telephony (per minute)
- Speech-to-text
- LLM usage
- Text-to-speech

For 100 calls averaging 2-3 minutes each, expect ~$50-150 in costs depending on models used.

## License

MIT
# phone-calls
