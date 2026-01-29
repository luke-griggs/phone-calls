import type { Context } from "hono";
/**
 * Main webhook handler
 */
export declare function handleVapiWebhook(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: boolean;
    callId: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: boolean;
    status: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    assistantId: string;
} | {
    assistant: {
        firstMessage: string;
        model: {
            provider: string;
            model: string;
            messages: {
                role: string;
                content: string;
            }[];
        };
        voice: {
            provider: string;
            voiceId: string;
        };
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=webhooks.d.ts.map