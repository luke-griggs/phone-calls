import { sql } from "./client.js";

export interface CreateHumanCallParams {
  vapiCallId: string;
  durationSeconds?: number;
  voiceProvider?: string;
  transcript?: string;
  recordingUrl?: string;
  rawPayload?: unknown;
}

// Human call operations
export async function createHumanCall(params: CreateHumanCallParams) {
  const result = await sql`
    INSERT INTO human_calls (
      vapi_call_id,
      duration_seconds,
      voice_provider,
      transcript,
      recording_url,
      raw_payload
    ) VALUES (
      ${params.vapiCallId},
      ${params.durationSeconds ?? null},
      ${params.voiceProvider ?? null},
      ${params.transcript ?? null},
      ${params.recordingUrl ?? null},
      ${params.rawPayload ? JSON.stringify(params.rawPayload) : null}
    )
    ON CONFLICT (vapi_call_id) DO UPDATE SET
      duration_seconds = COALESCE(EXCLUDED.duration_seconds, human_calls.duration_seconds),
      voice_provider = COALESCE(EXCLUDED.voice_provider, human_calls.voice_provider),
      transcript = COALESCE(EXCLUDED.transcript, human_calls.transcript),
      recording_url = COALESCE(EXCLUDED.recording_url, human_calls.recording_url),
      raw_payload = COALESCE(EXCLUDED.raw_payload, human_calls.raw_payload),
      updated_at = NOW()
    RETURNING *
  `;
  return result[0];
}

export async function getHumanCallByVapiId(vapiCallId: string) {
  const result = await sql`
    SELECT * FROM human_calls WHERE vapi_call_id = ${vapiCallId}
  `;
  return result[0];
}

export async function listHumanCalls(limit = 100) {
  return sql`
    SELECT * FROM human_calls 
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `;
}

export async function getHumanCallStats() {
  return sql`
    SELECT 
      COUNT(*) as total_calls,
      AVG(duration_seconds) as avg_duration,
      SUM(duration_seconds) as total_duration
    FROM human_calls
  `;
}
