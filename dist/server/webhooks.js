import { createHumanCall } from "../db/queries.js";
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
    // Calculate duration
    const durationSeconds = calculateDuration(call.startedAt, call.endedAt);
    // Extract voice provider
    const voiceProvider = call.assistant?.voice?.provider;
    const callData = {
        vapiCallId: call.id,
        durationSeconds: durationSeconds ?? undefined,
        voiceProvider: voiceProvider,
        transcript: artifact?.transcript ?? call.artifact?.transcript,
        recordingUrl: artifact?.recording ?? call.artifact?.recording,
        rawPayload: message,
    };
    try {
        const savedCall = await createHumanCall(callData);
        console.log(`[Webhook] Call data saved to database: ${savedCall.id}`);
        console.log(`[Webhook] Voice provider: ${voiceProvider}`);
        console.log(`[Webhook] Duration: ${durationSeconds}s`);
        return { success: true, callId: savedCall.id };
    }
    catch (error) {
        console.error(`[Webhook] Failed to save call data:`, error);
        throw error;
    }
}
/**
 * Main webhook handler - processes end-of-call reports from Vapi
 */
export async function handleVapiWebhook(c) {
    try {
        const payload = (await c.req.json());
        const { message } = payload;
        console.log(`[Webhook] Received ${message.type} event`);
        if (message.type !== "end-of-call-report") {
            console.log(`[Webhook] Ignoring non end-of-call-report event: ${message.type}`);
            return c.json({ success: true, message: "Event ignored" });
        }
        const result = await handleEndOfCallReport(message);
        return c.json(result);
    }
    catch (error) {
        console.error("[Webhook] Error processing webhook:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
}
//# sourceMappingURL=webhooks.js.map