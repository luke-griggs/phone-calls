# Vapi Dashboard Setup Guide

This guide walks you through setting up Vapi for agent-on-agent phone conversations.

## Prerequisites

1. A Vapi account at [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Your webhook server deployed and accessible via public URL

## Step 1: Get Your API Key

1. Go to **Account** → **API Keys** in Vapi Dashboard
2. Copy your API key
3. Add it to your `.env` file as `VAPI_API_KEY`

## Step 2: Create Two Phone Numbers

You need two phone numbers - one for Agent A (caller) and one for Agent B (receiver).

1. Go to **Phone Numbers** in the dashboard
2. Click **Buy Phone Number** or **Import Number**
3. Purchase/import two numbers
4. Note down the phone number IDs and actual numbers

Add to `.env`:
```
PHONE_A_ID=<first-phone-number-id>
PHONE_A_NUMBER=<first-phone-number>
PHONE_B_ID=<second-phone-number-id>
PHONE_B_NUMBER=<second-phone-number>
```

## Step 3: Create Assistant A (The Caller)

1. Go to **Assistants** → **Create Assistant**
2. Configure:
   - **Name**: `Agent A - Caller`
   - **Model**: Choose your preferred LLM (e.g., `gpt-4o`)
   - **Voice**: Choose a voice (e.g., ElevenLabs - Rachel)
   - **System Prompt**: Generic prompt (will be overridden per-call)
   
   ```
   You are an AI assistant making a phone call. Be natural and conversational.
   ```
   
   - **First Message**: Will be overridden per-call
   
3. Under **Server URL**, add your webhook endpoint:
   ```
   https://your-server.com/webhook/vapi
   ```

4. Under **Server Messages**, enable:
   - `end-of-call-report`
   - `status-update`

5. Save and copy the Assistant ID

Add to `.env`:
```
ASSISTANT_A_ID=<assistant-a-id>
```

## Step 4: Create Assistant B (The Receiver)

1. Go to **Assistants** → **Create Assistant**
2. Configure:
   - **Name**: `Agent B - Receiver`
   - **Model**: Choose your preferred LLM
   - **Voice**: Choose a DIFFERENT voice than Agent A (for distinction)
   - **System Prompt**: Generic prompt
   
   ```
   You are an AI assistant receiving a phone call. Be helpful and engaging.
   ```

3. Under **Server URL**, add the same webhook endpoint:
   ```
   https://your-server.com/webhook/vapi
   ```

4. Under **Server Messages**, enable:
   - `end-of-call-report`
   - `status-update`
   - `assistant-request` (if you want dynamic assistant selection)

5. Save and copy the Assistant ID

Add to `.env`:
```
ASSISTANT_B_ID=<assistant-b-id>
```

## Step 5: Configure Phone Number B to Use Assistant B

This is crucial - when Agent A calls Phone B, Phone B needs to know which assistant to use.

1. Go to **Phone Numbers**
2. Click on Phone Number B
3. Under **Inbound Settings**, set:
   - **Assistant**: Select `Agent B - Receiver`
   - OR leave empty if using `assistant-request` webhook for dynamic selection

## Step 6: Test the Setup

Run a single test call:

```bash
# Set your environment variables
export VAPI_API_KEY=your_api_key

# Make a test API call
curl -X POST https://api.vapi.ai/call \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumberId": "YOUR_PHONE_A_ID",
    "assistantId": "YOUR_ASSISTANT_A_ID",
    "customer": {
      "number": "+1YOUR_PHONE_B_NUMBER"
    },
    "metadata": {
      "topic": "test",
      "experimentId": "test-001"
    }
  }'
```

## Voice Model Options

Popular voice providers and voices:

### ElevenLabs
- `21m00Tcm4TlvDq8ikWAM` - Rachel (warm, professional)
- `AZnzlk1XvdvUeBnXmlld` - Domi (young, energetic)
- `EXAVITQu4vr4xnSDxMaL` - Bella (soft, gentle)

### Azure
- `andrew` - Male, US English
- `jenny` - Female, US English

### PlayHT
- Various natural voices available

## Troubleshooting

### Calls not connecting
- Verify phone numbers are correctly purchased/imported
- Check that Phone B has an assistant assigned for inbound calls

### Webhook not receiving events
- Ensure your server URL is publicly accessible (not localhost)
- Check HTTPS is working correctly
- Verify the server URL is saved in assistant settings

### Missing voice/model data
- The voice and model info is in `call.assistant.voice` and `call.assistant.model`
- Ensure your assistant has voice and model configured

## Architecture Summary

```
┌─────────────┐         ┌─────────────┐
│  Phone A    │────────▶│  Phone B    │
│ (outbound)  │  call   │ (inbound)   │
│ Assistant A │         │ Assistant B │
└─────────────┘         └─────────────┘
       │                       │
       │ webhook               │ webhook
       ▼                       ▼
┌─────────────────────────────────────┐
│         Your Webhook Server         │
│   (receives end-of-call-report)     │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         Neon Postgres DB            │
│   (stores call data & transcripts)  │
└─────────────────────────────────────┘
```
