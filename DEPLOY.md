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
