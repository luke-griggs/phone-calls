import { sql } from "./client.js";

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

// Experiment operations
export async function createExperiment(params: CreateExperimentParams) {
  const result = await sql`
    INSERT INTO experiments (name, description)
    VALUES (${params.name}, ${params.description ?? null})
    RETURNING *
  `;
  return result[0];
}

export async function getExperiment(id: string) {
  const result = await sql`
    SELECT * FROM experiments WHERE id = ${id}
  `;
  return result[0];
}

export async function listExperiments() {
  return sql`SELECT * FROM experiments ORDER BY created_at DESC`;
}

// Call operations
export async function createCall(params: CreateCallParams) {
  const result = await sql`
    INSERT INTO calls (
      vapi_call_id,
      experiment_id,
      topic,
      agent_a_assistant_id,
      agent_a_voice_provider,
      agent_a_voice_id,
      agent_a_model_provider,
      agent_a_model,
      agent_a_prompt,
      agent_b_assistant_id,
      agent_b_voice_provider,
      agent_b_voice_id,
      agent_b_model_provider,
      agent_b_model,
      agent_b_prompt,
      status,
      ended_reason,
      started_at,
      ended_at,
      duration_seconds,
      transcript,
      messages,
      recording_url,
      cost,
      cost_breakdown,
      raw_payload
    ) VALUES (
      ${params.vapiCallId},
      ${params.experimentId ?? null},
      ${params.topic ?? null},
      ${params.agentAAssistantId ?? null},
      ${params.agentAVoiceProvider ?? null},
      ${params.agentAVoiceId ?? null},
      ${params.agentAModelProvider ?? null},
      ${params.agentAModel ?? null},
      ${params.agentAPrompt ?? null},
      ${params.agentBAssistantId ?? null},
      ${params.agentBVoiceProvider ?? null},
      ${params.agentBVoiceId ?? null},
      ${params.agentBModelProvider ?? null},
      ${params.agentBModel ?? null},
      ${params.agentBPrompt ?? null},
      ${params.status ?? null},
      ${params.endedReason ?? null},
      ${params.startedAt ?? null},
      ${params.endedAt ?? null},
      ${params.durationSeconds ?? null},
      ${params.transcript ?? null},
      ${params.messages ? JSON.stringify(params.messages) : null},
      ${params.recordingUrl ?? null},
      ${params.cost ?? null},
      ${params.costBreakdown ? JSON.stringify(params.costBreakdown) : null},
      ${params.rawPayload ? JSON.stringify(params.rawPayload) : null}
    )
    ON CONFLICT (vapi_call_id) DO UPDATE SET
      status = COALESCE(EXCLUDED.status, calls.status),
      ended_reason = COALESCE(EXCLUDED.ended_reason, calls.ended_reason),
      started_at = COALESCE(EXCLUDED.started_at, calls.started_at),
      ended_at = COALESCE(EXCLUDED.ended_at, calls.ended_at),
      duration_seconds = COALESCE(EXCLUDED.duration_seconds, calls.duration_seconds),
      transcript = COALESCE(EXCLUDED.transcript, calls.transcript),
      messages = COALESCE(EXCLUDED.messages, calls.messages),
      recording_url = COALESCE(EXCLUDED.recording_url, calls.recording_url),
      cost = COALESCE(EXCLUDED.cost, calls.cost),
      cost_breakdown = COALESCE(EXCLUDED.cost_breakdown, calls.cost_breakdown),
      raw_payload = COALESCE(EXCLUDED.raw_payload, calls.raw_payload),
      agent_a_voice_provider = COALESCE(EXCLUDED.agent_a_voice_provider, calls.agent_a_voice_provider),
      agent_a_voice_id = COALESCE(EXCLUDED.agent_a_voice_id, calls.agent_a_voice_id),
      agent_a_model_provider = COALESCE(EXCLUDED.agent_a_model_provider, calls.agent_a_model_provider),
      agent_a_model = COALESCE(EXCLUDED.agent_a_model, calls.agent_a_model),
      agent_b_voice_provider = COALESCE(EXCLUDED.agent_b_voice_provider, calls.agent_b_voice_provider),
      agent_b_voice_id = COALESCE(EXCLUDED.agent_b_voice_id, calls.agent_b_voice_id),
      agent_b_model_provider = COALESCE(EXCLUDED.agent_b_model_provider, calls.agent_b_model_provider),
      agent_b_model = COALESCE(EXCLUDED.agent_b_model, calls.agent_b_model),
      updated_at = NOW()
    RETURNING *
  `;
  return result[0];
}

export async function getCallByVapiId(vapiCallId: string) {
  const result = await sql`
    SELECT * FROM calls WHERE vapi_call_id = ${vapiCallId}
  `;
  return result[0];
}

export async function listCalls(experimentId?: string, limit = 100) {
  if (experimentId) {
    return sql`
      SELECT * FROM calls 
      WHERE experiment_id = ${experimentId}
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;
  }
  return sql`
    SELECT * FROM calls 
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `;
}

export async function getCallStats(experimentId?: string) {
  if (experimentId) {
    return sql`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(DISTINCT topic) as unique_topics,
        AVG(duration_seconds) as avg_duration,
        SUM(cost) as total_cost,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as completed_calls
      FROM calls 
      WHERE experiment_id = ${experimentId}
    `;
  }
  return sql`
    SELECT 
      COUNT(*) as total_calls,
      COUNT(DISTINCT topic) as unique_topics,
      AVG(duration_seconds) as avg_duration,
      SUM(cost) as total_cost,
      COUNT(CASE WHEN status = 'ended' THEN 1 END) as completed_calls
    FROM calls
  `;
}
