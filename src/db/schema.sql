-- Vapi Agent Conversation Data Collection Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Experiments table to track different conversation topics/batches
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calls table to store individual call data
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id VARCHAR(255) UNIQUE NOT NULL,
  experiment_id UUID REFERENCES experiments(id),
  topic VARCHAR(255),
  
  -- Agent A (caller) info
  agent_a_assistant_id VARCHAR(255),
  agent_a_voice_provider VARCHAR(100),
  agent_a_voice_id VARCHAR(255),
  agent_a_model_provider VARCHAR(100),
  agent_a_model VARCHAR(255),
  agent_a_prompt TEXT,
  
  -- Agent B (receiver) info
  agent_b_assistant_id VARCHAR(255),
  agent_b_voice_provider VARCHAR(100),
  agent_b_voice_id VARCHAR(255),
  agent_b_model_provider VARCHAR(100),
  agent_b_model VARCHAR(255),
  agent_b_prompt TEXT,
  
  -- Call metadata
  status VARCHAR(50),
  ended_reason VARCHAR(255),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Conversation data
  transcript TEXT,
  messages JSONB,
  recording_url TEXT,
  
  -- Cost tracking
  cost DECIMAL(10, 6),
  cost_breakdown JSONB,
  
  -- Raw data for debugging
  raw_payload JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_experiment_id ON calls(experiment_id);
CREATE INDEX IF NOT EXISTS idx_calls_topic ON calls(topic);
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
