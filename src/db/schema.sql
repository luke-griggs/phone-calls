-- Vapi Human Conversation Tracking Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Human calls table to track conversations with humans
CREATE TABLE IF NOT EXISTS human_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Call metadata
  duration_seconds INTEGER,
  voice_provider VARCHAR(100),
  
  -- Conversation data
  transcript TEXT,
  recording_url TEXT,
  
  -- Raw data for debugging
  raw_payload JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_human_calls_vapi_call_id ON human_calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_human_calls_created_at ON human_calls(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_human_calls_updated_at ON human_calls;
CREATE TRIGGER update_human_calls_updated_at
  BEFORE UPDATE ON human_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
