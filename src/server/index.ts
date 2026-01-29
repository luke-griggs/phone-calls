import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "dotenv";
import { handleVapiWebhook } from "./webhooks.js";
import { testConnection } from "../db/client.js";
import { listCalls, getCallStats, listExperiments } from "../db/queries.js";

// Load environment variables
config();

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "vapi-agent-conversations",
    timestamp: new Date().toISOString(),
  });
});

// Health check with database status
app.get("/health", async (c) => {
  const dbConnected = await testConnection();
  return c.json({
    status: dbConnected ? "healthy" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Vapi webhook endpoint
app.post("/webhook/vapi", handleVapiWebhook);

// Alternative webhook path (some prefer /api/webhook)
app.post("/api/webhook/vapi", handleVapiWebhook);

// API endpoints for viewing data
app.get("/api/calls", async (c) => {
  const experimentId = c.req.query("experimentId");
  const limit = parseInt(c.req.query("limit") ?? "100");

  try {
    const calls = await listCalls(experimentId, limit);
    return c.json({ calls, count: calls.length });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return c.json({ error: "Failed to fetch calls" }, 500);
  }
});

app.get("/api/stats", async (c) => {
  const experimentId = c.req.query("experimentId");

  try {
    const stats = await getCallStats(experimentId);
    return c.json({ stats: stats[0] });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

app.get("/api/experiments", async (c) => {
  try {
    const experiments = await listExperiments();
    return c.json({ experiments });
  } catch (error) {
    console.error("Error fetching experiments:", error);
    return c.json({ error: "Failed to fetch experiments" }, 500);
  }
});

// Start server
const port = parseInt(process.env.PORT ?? "3000");

console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Vapi Agent Conversation Data Collection Server        ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║  - GET  /              Health check                       ║
║  - GET  /health        Health with DB status              ║
║  - POST /webhook/vapi  Vapi webhook receiver              ║
║  - GET  /api/calls     List recorded calls                ║
║  - GET  /api/stats     Call statistics                    ║
║  - GET  /api/experiments  List experiments                ║
╚═══════════════════════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running on http://localhost:${port}`);
