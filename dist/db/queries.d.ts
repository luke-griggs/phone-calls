export interface CreateExperimentParams {
    name: string;
    description?: string;
}
export interface CreateCallParams {
    vapiCallId: string;
    experimentId?: string;
    topic?: string;
    agentAAssistantId?: string;
    agentAVoiceProvider?: string;
    agentAVoiceId?: string;
    agentAModelProvider?: string;
    agentAModel?: string;
    agentAPrompt?: string;
    agentBAssistantId?: string;
    agentBVoiceProvider?: string;
    agentBVoiceId?: string;
    agentBModelProvider?: string;
    agentBModel?: string;
    agentBPrompt?: string;
    status?: string;
    endedReason?: string;
    startedAt?: Date;
    endedAt?: Date;
    durationSeconds?: number;
    transcript?: string;
    messages?: unknown[];
    recordingUrl?: string;
    cost?: number;
    costBreakdown?: unknown;
    rawPayload?: unknown;
}
export interface UpdateCallParams {
    vapiCallId: string;
    agentAVoiceProvider?: string;
    agentAVoiceId?: string;
    agentAModelProvider?: string;
    agentAModel?: string;
    agentBVoiceProvider?: string;
    agentBVoiceId?: string;
    agentBModelProvider?: string;
    agentBModel?: string;
    status?: string;
    endedReason?: string;
    startedAt?: Date;
    endedAt?: Date;
    durationSeconds?: number;
    transcript?: string;
    messages?: unknown[];
    recordingUrl?: string;
    cost?: number;
    costBreakdown?: unknown;
    rawPayload?: unknown;
}
export declare function createExperiment(params: CreateExperimentParams): Promise<Record<string, any>>;
export declare function getExperiment(id: string): Promise<Record<string, any>>;
export declare function listExperiments(): Promise<Record<string, any>[]>;
export declare function createCall(params: CreateCallParams): Promise<Record<string, any>>;
export declare function getCallByVapiId(vapiCallId: string): Promise<Record<string, any>>;
export declare function listCalls(experimentId?: string, limit?: number): Promise<Record<string, any>[]>;
export declare function getCallStats(experimentId?: string): Promise<Record<string, any>[]>;
//# sourceMappingURL=queries.d.ts.map