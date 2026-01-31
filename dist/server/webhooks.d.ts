import type { Context } from "hono";
/**
 * Main webhook handler - processes end-of-call reports from Vapi
 */
export declare function handleVapiWebhook(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: boolean;
    callId: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=webhooks.d.ts.map