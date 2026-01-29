export interface VapiVoice {
    provider: string;
    voiceId: string;
    cachingEnabled?: boolean;
    speed?: number;
}
export interface VapiModel {
    provider: string;
    model: string;
    messages?: Array<{
        role: string;
        content: string;
    }>;
    temperature?: number;
}
export interface VapiAssistant {
    id?: string;
    name?: string;
    voice?: VapiVoice;
    model?: VapiModel;
    firstMessage?: string;
    transcriber?: {
        provider: string;
        language?: string;
    };
}
export interface VapiCustomer {
    number: string;
    name?: string;
}
export interface VapiPhoneNumber {
    id: string;
    number: string;
}
export interface VapiCostBreakdown {
    transport?: number;
    stt?: number;
    llm?: number;
    tts?: number;
    vapi?: number;
    total?: number;
    analysisCostBreakdown?: {
        summary?: number;
        structuredData?: number;
        successEvaluation?: number;
    };
}
export interface VapiRecording {
    url?: string;
    stereoUrl?: string;
}
export interface VapiMessage {
    role: "assistant" | "user" | "system" | "tool";
    message?: string;
    content?: string;
    time?: number;
    secondsFromStart?: number;
}
export interface VapiArtifact {
    transcript?: string;
    recording?: VapiRecording;
    messages?: VapiMessage[];
    messagesOpenAIFormatted?: Array<{
        role: string;
        content: string;
    }>;
    stereoRecordingUrl?: string;
    videoRecordingUrl?: string;
}
export interface VapiCall {
    id: string;
    orgId?: string;
    type?: "inboundPhoneCall" | "outboundPhoneCall" | "webCall";
    status?: string;
    endedReason?: string;
    cost?: number;
    costBreakdown?: VapiCostBreakdown;
    startedAt?: string;
    endedAt?: string;
    assistant?: VapiAssistant;
    assistantId?: string;
    assistantOverrides?: Partial<VapiAssistant>;
    customer?: VapiCustomer;
    phoneNumber?: VapiPhoneNumber;
    phoneNumberId?: string;
    metadata?: Record<string, unknown>;
    artifact?: VapiArtifact;
}
export interface VapiEndOfCallReportMessage {
    type: "end-of-call-report";
    call: VapiCall;
    artifact?: VapiArtifact;
    endedReason?: string;
    phoneNumber?: VapiPhoneNumber;
    customer?: VapiCustomer;
    timestamp?: string;
}
export interface VapiStatusUpdateMessage {
    type: "status-update";
    status: string;
    call: VapiCall;
    timestamp?: string;
}
export interface VapiTranscriptMessage {
    type: "transcript";
    role: "user" | "assistant";
    transcriptType: "partial" | "final";
    transcript: string;
    call?: VapiCall;
}
export interface VapiAssistantRequestMessage {
    type: "assistant-request";
    call: VapiCall;
}
export type VapiWebhookMessage = VapiEndOfCallReportMessage | VapiStatusUpdateMessage | VapiTranscriptMessage | VapiAssistantRequestMessage;
export interface VapiWebhookPayload {
    message: VapiWebhookMessage;
}
export interface CreateCallRequest {
    phoneNumberId?: string;
    assistantId?: string;
    assistant?: Partial<VapiAssistant>;
    assistantOverrides?: Partial<VapiAssistant>;
    customer?: {
        number: string;
        name?: string;
    };
    metadata?: Record<string, unknown>;
    name?: string;
}
export interface CreateCallResponse extends VapiCall {
}
export interface TopicConfig {
    topic: string;
    promptA: string;
    promptB: string;
    firstMessageA?: string;
    firstMessageB?: string;
    description?: string;
}
//# sourceMappingURL=vapi.d.ts.map