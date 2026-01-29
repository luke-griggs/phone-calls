# Deployment Guide

This guide covers deploying the webhook server so Vapi can send callbacks.

## Requirements

- Public HTTPS URL (Vapi requires HTTPS)
- Node.js 18+ runtime
- Access to environment variables

## Option 1: Railway (Recommended)

Railway is simple and has a generous free tier.

### Steps

1. Install Railway CLI:
```bash
npm i -g @railway/cli
railway login
```

2. Initialize project:
```bash
cd phone-calls
railway init
```

3. Add environment variables in Railway dashboard:
- `DATABASE_URL`
- `VAPI_API_KEY`
- `PHONE_A_ID`
- `PHONE_B_NUMBER`
- `ASSISTANT_A_ID`
- `ASSISTANT_B_ID`

4. Deploy:
```bash
railway up
```

5. Get your URL from Railway dashboard (e.g., `https://your-app.railway.app`)

6. Configure Vapi webhook URL:
```
https://your-app.railway.app/webhook/vapi
```

## Option 2: Render

### Steps

1. Create a new Web Service on [render.com](https://render.com)

2. Connect your GitHub repository

3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

4. Add environment variables in Render dashboard

5. Deploy - Render provides HTTPS automatically

6. Your URL: `https://your-service.onrender.com/webhook/vapi`

## Option 3: Fly.io

### Steps

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

2. Create `fly.toml`:
```toml
app = "vapi-conversations"
primary_region = "sjc"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
```

3. Launch and deploy:
```bash
fly launch
fly secrets set DATABASE_URL="your-connection-string"
fly secrets set VAPI_API_KEY="your-api-key"
# ... set other secrets
fly deploy
```

4. Your URL: `https://vapi-conversations.fly.dev/webhook/vapi`

## Option 4: ngrok (Development/Testing)

For local development and testing, use ngrok to expose your local server.

### Steps

1. Start your local server:
```bash
npm run dev
```

2. In another terminal, start ngrok:
```bash
ngrok http 3000
```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Configure Vapi webhook URL:
```
https://abc123.ngrok.io/webhook/vapi
```

**Note**: ngrok URLs change each time you restart (unless you have a paid plan). Good for testing, not production.

## Option 5: Vercel

Vercel requires adapting the Hono server to work with Vercel's edge functions.

### Steps

1. Create `api/webhook/vapi.ts`:
```typescript
import { handle } from 'hono/vercel'
import { app } from '../../src/server/index'

export const config = { runtime: 'edge' }
export default handle(app)
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

4. Your URL: `https://your-project.vercel.app/api/webhook/vapi`

## Testing Your Deployment

### 1. Health Check
```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test Webhook Manually
```bash
curl -X POST https://your-domain.com/webhook/vapi \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "status-update",
      "status": "ringing",
      "call": { "id": "test-123" }
    }
  }'
```

### 3. Make a Test Call
```bash
npm run orchestrate -- --topic=billing_inquiry --limit=1
```

Check your database or the `/api/calls` endpoint to verify data was captured.

## Troubleshooting

### Webhook not receiving events
- Verify URL is HTTPS
- Check server logs for incoming requests
- Ensure Vapi assistant has `serverUrl` configured
- Verify `end-of-call-report` is in `serverMessages`

### Database connection issues
- Verify `DATABASE_URL` is set correctly
- Check if your IP is whitelisted (Neon allows all by default)
- Test connection with `npm run db:migrate`

### Calls not initiating
- Verify `VAPI_API_KEY` is valid
- Check phone numbers are correctly configured
- Ensure assistant IDs exist

## Security Considerations

1. **Webhook Authentication**: Consider adding a secret header to verify webhook requests are from Vapi

2. **Rate Limiting**: Add rate limiting if exposing public endpoints

3. **Environment Variables**: Never commit `.env` files

4. **Database**: Use connection pooling for production (Neon handles this)

## Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (Logtail, Papertrail)
