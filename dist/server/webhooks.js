import { createHumanCall } from "../db/queries.js";
/**
 * Handle end-of-call-report webhook
 * This is sent when a call ends and contains all the call data
 */
async function handleEndOfCallReport(message) {
    const { call, artifact } = message;
    console.log(`[Webhook] End of call report for call ${call.id}`);
    console.log(`[Webhook] Ended reason: ${message.endedReason}`);
    // Get duration directly from message (provided by VAPI)
    const durationSeconds = message.durationSeconds;
    // Extract voice provider from assistant config
    const voiceProvider = call.assistant?.voice?.provider;
    // Get transcript from artifact
    const transcript = artifact?.transcript ?? call.artifact?.transcript;
    // Get recording URL from message (top-level) or artifact
    const recordingUrl = message.recordingUrl ?? artifact?.recording ?? call.artifact?.recording;
    const callData = {
        vapiCallId: call.id,
        durationSeconds: durationSeconds,
        voiceProvider: voiceProvider,
        transcript: transcript,
        recordingUrl: recordingUrl,
        rawPayload: message,
    };
    try {
        const savedCall = await createHumanCall(callData);
        console.log(`[Webhook] Call data saved to database: ${savedCall.id}`);
        console.log(`[Webhook] Voice provider: ${voiceProvider}`);
        console.log(`[Webhook] Duration: ${durationSeconds}s`);
        console.log(`[Webhook] Recording URL: ${recordingUrl}`);
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