import type { Context } from "hono";
import { createCall } from "../db/queries.js";
import type {
  VapiWebhookPayload,
  VapiEndOfCallReportMessage,
  VapiCall,
} from "../types/vapi.js";

/**
 * Extract voice model info from a Vapi call object
 */
function extractVoiceInfo(call: VapiCall) {
  const voice = call.assistant?.voice;
  return {
    voiceProvider: voice?.provider,
    voiceId: voice?.voiceId,
  };
}

/**
 * Extract model info from a Vapi call object
 */
function extractModelInfo(call: VapiCall) {
  const model = call.assistant?.model;
  return {
    modelProvider: model?.provider,
    model: model?.model,
  };
}

/**
 * Calculate duration from start and end times
 */
function calculateDuration(startedAt?: string, endedAt?: string): number | null {
  if (!startedAt || !endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.round((end - start) / 1000);
}

/**
 * Handle end-of-call-report webhook
 * This is sent when a call ends and contains all the call data
 */
async function handleEndOfCallReport(message: VapiEndOfCallReportMessage) {
  const { call, artifact } = message;

  console.log(`[Webhook] End of call report for call ${call.id}`);
  console.log(`[Webhook] Ended reason: ${call.endedReason ?? message.endedReason}`);

  // Extract voice and model info
  const voiceInfo = extractVoiceInfo(call);
  const modelInfo = extractModelInfo(call);

  // Get metadata (topic, experimentId) that we set when initiating the call
  const metadata = call.metadata ?? {};
  const topic = metadata.topic as string | undefined;
  const experimentId = metadata.experimentId as string | undefined;
  const agentRole = metadata.agentRole as string | undefined; // 'A' or 'B'

  // Calculate duration
  const durationSeconds = calculateDuration(call.startedAt, call.endedAt);

  // Prepare call data based on which agent this report is for
  const isAgentA = agentRole === "A" || call.type === "outboundPhoneCall";

  const callData = {
    vapiCallId: call.id,
    experimentId: experimentId,
    topic: topic,
    
    // Agent info - set based on which agent this report is for
    ...(isAgentA ? {
      agentAAssistantId: call.assistantId ?? call.assistant?.id,
      agentAVoiceProvider: voiceInfo.voiceProvider,
      agentAVoiceId: voiceInfo.voiceId,
      agentAModelProvider: modelInfo.modelProvider,
      agentAModel: modelInfo.model,
    } : {
      agentBAssistantId: call.assistantId ?? call.assistant?.id,
      agentBVoiceProvider: voiceInfo.voiceProvider,
      agentBVoiceId: voiceInfo.voiceId,
      agentBModelProvider: modelInfo.modelProvider,
      agentBModel: modelInfo.model,
    }),

    status: call.status ?? "ended",
    endedReason: call.endedReason ?? message.endedReason,
    startedAt: call.startedAt ? new Date(call.startedAt) : undefined,
    endedAt: call.endedAt ? new Date(call.endedAt) : undefined,
    durationSeconds: durationSeconds ?? undefined,

    // Artifact data
    transcript: artifact?.transcript ?? call.artifact?.transcript,
    messages: artifact?.messages ?? call.artifact?.messages,
    recordingUrl: artifact?.recording?.url ?? call.artifact?.recording?.url,

    // Cost data
    cost: call.cost,
    costBreakdown: call.costBreakdown,

    // Store raw payload for debugging
    rawPayload: message,
  };

  try {
    const savedCall = await createCall(callData);
    console.log(`[Webhook] Call data saved to database: ${savedCall.id}`);

    // Log key metrics
    console.log(`[Webhook] Voice: ${voiceInfo.voiceProvider}/${voiceInfo.voiceId}`);
    console.log(`[Webhook] Model: ${modelInfo.modelProvider}/${modelInfo.model}`);
    console.log(`[Webhook] Duration: ${durationSeconds}s, Cost: $${call.cost?.toFixed(4)}`);

    return { success: true, callId: savedCall.id };
  } catch (error) {
    console.error(`[Webhook] Failed to save call data:`, error);
    throw error;
  }
}

/**
 * Main webhook handler - processes end-of-call reports from Vapi
 */
export async function handleVapiWebhook(c: Context) {
  try {
    const payload = (await c.req.json()) as VapiWebhookPayload;
    const { message } = payload;

    console.log(`[Webhook] Received ${message.type} event`);

    if (message.type !== "end-of-call-report") {
      console.log(`[Webhook] Ignoring non end-of-call-report event: ${message.type}`);
      return c.json({ success: true, message: "Event ignored" });
    }

    const result = await handleEndOfCallReport(message);
    return c.json(result);
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
