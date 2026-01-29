import { createCall, } from "../db/queries.js";
/**
 * Extract voice model info from a Vapi call object
 */
function extractVoiceInfo(call) {
    const voice = call.assistant?.voice;
    return {
        voiceProvider: voice?.provider,
        voiceId: voice?.voiceId,
    };
}
/**
 * Extract model info from a Vapi call object
 */
function extractModelInfo(call) {
    const model = call.assistant?.model;
    return {
        modelProvider: model?.provider,
        model: model?.model,
    };
}
/**
 * Calculate duration from start and end times
 */
function calculateDuration(startedAt, endedAt) {
    if (!startedAt || !endedAt)
        return null;
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    return Math.round((end - start) / 1000);
}
/**
 * Handle end-of-call-report webhook
 * This is sent when a call ends and contains all the call data
 */
async function handleEndOfCallReport(message) {
    const { call, artifact } = message;
    console.log(`[Webhook] End of call report for call ${call.id}`);
    console.log(`[Webhook] Ended reason: ${call.endedReason ?? message.endedReason}`);
    // Extract voice and model info
    const voiceInfo = extractVoiceInfo(call);
    const modelInfo = extractModelInfo(call);
    // Get metadata (topic, experimentId) that we set when initiating the call
    const metadata = call.metadata ?? {};
    const topic = metadata.topic;
    const experimentId = metadata.experimentId;
    const agentRole = metadata.agentRole; // 'A' or 'B'
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
    }
    catch (error) {
        console.error(`[Webhook] Failed to save call data:`, error);
        throw error;
    }
}
/**
 * Handle status-update webhook
 * Sent during call lifecycle (queued, ringing, in-progress, ended)
 */
async function handleStatusUpdate(message) {
    console.log(`[Webhook] Status update: ${message.status} for call ${message.call.id}`);
    // Optionally track status changes
    if (message.status === "in-progress") {
        console.log(`[Webhook] Call ${message.call.id} is now in progress`);
    }
    return { success: true, status: message.status };
}
/**
 * Handle assistant-request webhook
 * This is called for inbound calls to dynamically assign an assistant
 */
async function handleAssistantRequest(message) {
    console.log(`[Webhook] Assistant request for call ${message.call.id}`);
    // For agent-on-agent calls, we return the configured assistant
    // The assistant ID should be configured on the phone number in Vapi dashboard
    // This handler is here if you need dynamic assistant selection
    // You can return a specific assistantId or a full assistant object
    const assistantId = process.env.ASSISTANT_B_ID;
    if (assistantId) {
        return { assistantId };
    }
    // Or return a transient assistant configuration
    return {
        assistant: {
            firstMessage: "Hello, I'm ready to have a conversation with you.",
            model: {
                provider: "openai",
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful AI assistant having a phone conversation. Be natural, engaging, and concise.",
                    },
                ],
            },
            voice: {
                provider: "11labs",
                voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
            },
        },
    };
}
/**
 * Main webhook handler
 */
export async function handleVapiWebhook(c) {
    try {
        const payload = (await c.req.json());
        const { message } = payload;
        console.log(`[Webhook] Received ${message.type} event`);
        switch (message.type) {
            case "end-of-call-report":
                const endOfCallResult = await handleEndOfCallReport(message);
                return c.json(endOfCallResult);
            case "status-update":
                const statusResult = await handleStatusUpdate(message);
                return c.json(statusResult);
            case "assistant-request":
                const assistantResult = await handleAssistantRequest(message);
                return c.json(assistantResult);
            default:
                // Handle other message types (transcript, tool-calls, etc.)
                console.log(`[Webhook] Unhandled message type: ${message.type}`);
                return c.json({ success: true, message: "Event received" });
        }
    }
    catch (error) {
        console.error("[Webhook] Error processing webhook:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
}
//# sourceMappingURL=webhooks.js.map