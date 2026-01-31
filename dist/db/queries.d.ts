export interface CreateHumanCallParams {
    vapiCallId: string;
    durationSeconds?: number;
    voiceProvider?: string;
    transcript?: string;
    recordingUrl?: string;
    rawPayload?: unknown;
}
export declare function createHumanCall(params: CreateHumanCallParams): Promise<Record<string, any>>;
export declare function getHumanCallByVapiId(vapiCallId: string): Promise<Record<string, any>>;
export declare function listHumanCalls(limit?: number): Promise<Record<string, any>[]>;
export declare function getHumanCallStats(): Promise<Record<string, any>[]>;
//# sourceMappingURL=queries.d.ts.map