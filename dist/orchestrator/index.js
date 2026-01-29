import { config } from "dotenv";
import { topics } from "./topics.js";
import { createExperiment, createCall } from "../db/queries.js";
config();
// Configuration
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_A_ID = process.env.PHONE_A_ID;
const PHONE_B_NUMBER = process.env.PHONE_B_NUMBER;
const ASSISTANT_A_ID = process.env.ASSISTANT_A_ID;
// Rate limiting configuration
const DELAY_BETWEEN_CALLS_MS = 10000; // 10 seconds between calls
const MAX_CONCURRENT_CALLS = 1; // For safety, run calls sequentially
if (!VAPI_API_KEY || !PHONE_A_ID || !PHONE_B_NUMBER || !ASSISTANT_A_ID) {
    console.error("Missing required environment variables:");
    console.error("- VAPI_API_KEY:", VAPI_API_KEY ? "✓" : "✗");
    console.error("- PHONE_A_ID:", PHONE_A_ID ? "✓" : "✗");
    console.error("- PHONE_B_NUMBER:", PHONE_B_NUMBER ? "✓" : "✗");
    console.error("- ASSISTANT_A_ID:", ASSISTANT_A_ID ? "✓" : "✗");
    process.exit(1);
}
/**
 * Initiate a single call via Vapi API
 */
async function initiateCall(topic, experimentId) {
    const requestBody = {
        phoneNumberId: PHONE_A_ID,
        assistantId: ASSISTANT_A_ID,
        customer: {
            number: PHONE_B_NUMBER,
        },
        assistantOverrides: {
            model: {
                provider: "openai",
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: topic.promptA,
                    },
                ],
            },
            firstMessage: topic.firstMessageA,
        },
        metadata: {
            topic: topic.topic,
            experimentId: experimentId,
            agentRole: "A",
            promptA: topic.promptA,
            promptB: topic.promptB,
            description: topic.description,
        },
        name: `${topic.topic}-${Date.now()}`,
    };
    try {
        const response = await fetch("https://api.vapi.ai/call", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}):`, errorText);
            return null;
        }
        const callData = (await response.json());
        console.log(`✓ Call initiated: ${callData.id} - Topic: ${topic.topic}`);
        // Pre-create call record in database with topic info
        await createCall({
            vapiCallId: callData.id,
            experimentId: experimentId,
            topic: topic.topic,
            agentAPrompt: topic.promptA,
            agentBPrompt: topic.promptB,
            status: "initiated",
        });
        return callData;
    }
    catch (error) {
        console.error(`Failed to initiate call for topic "${topic.topic}":`, error);
        return null;
    }
}
/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Run a batch of calls with rate limiting
 */
async function runExperiment(experimentName, selectedTopics, options = {}) {
    const { dryRun = false, delayMs = DELAY_BETWEEN_CALLS_MS } = options;
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Vapi Agent Conversation Orchestrator            ║
╠═══════════════════════════════════════════════════════════╣
║  Experiment: ${experimentName.padEnd(42)}║
║  Topics: ${String(selectedTopics.length).padEnd(46)}║
║  Dry Run: ${String(dryRun).padEnd(45)}║
║  Delay: ${String(delayMs + "ms").padEnd(47)}║
╚═══════════════════════════════════════════════════════════╝
  `);
    if (dryRun) {
        console.log("\n[DRY RUN] Would initiate the following calls:\n");
        selectedTopics.forEach((topic, i) => {
            console.log(`${i + 1}. Topic: ${topic.topic}`);
            console.log(`   Prompt A: ${topic.promptA.substring(0, 60)}...`);
            console.log(`   First Message: ${topic.firstMessageA ?? "(default)"}`);
            console.log("");
        });
        return;
    }
    // Create experiment record
    console.log("Creating experiment record...");
    const experiment = await createExperiment({
        name: experimentName,
        description: `Batch of ${selectedTopics.length} agent-on-agent calls`,
    });
    const experimentId = experiment.id;
    console.log(`Experiment created: ${experimentId}\n`);
    // Track results
    const results = {
        total: selectedTopics.length,
        successful: 0,
        failed: 0,
        callIds: [],
    };
    // Run calls sequentially with delay
    for (let i = 0; i < selectedTopics.length; i++) {
        const topic = selectedTopics[i];
        console.log(`\n[${i + 1}/${selectedTopics.length}] Initiating call for: ${topic.topic}`);
        const call = await initiateCall(topic, experimentId);
        if (call) {
            results.successful++;
            results.callIds.push(call.id);
        }
        else {
            results.failed++;
        }
        // Wait before next call (except for the last one)
        if (i < selectedTopics.length - 1) {
            console.log(`Waiting ${delayMs / 1000}s before next call...`);
            await sleep(delayMs);
        }
    }
    // Print summary
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    Experiment Complete                    ║
╠═══════════════════════════════════════════════════════════╣
║  Total Calls: ${String(results.total).padEnd(41)}║
║  Successful: ${String(results.successful).padEnd(42)}║
║  Failed: ${String(results.failed).padEnd(46)}║
║  Experiment ID: ${experimentId.substring(0, 36).padEnd(39)}║
╚═══════════════════════════════════════════════════════════╝
  `);
    return results;
}
/**
 * CLI Entry Point
 */
async function main() {
    const args = process.argv.slice(2);
    // Parse CLI arguments
    const dryRun = args.includes("--dry-run");
    const limitArg = args.find((a) => a.startsWith("--limit="));
    const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;
    const topicArg = args.find((a) => a.startsWith("--topic="));
    const specificTopic = topicArg ? topicArg.split("=")[1] : undefined;
    const delayArg = args.find((a) => a.startsWith("--delay="));
    const delay = delayArg ? parseInt(delayArg.split("=")[1]) : DELAY_BETWEEN_CALLS_MS;
    // Select topics
    let selectedTopics = topics;
    if (specificTopic) {
        selectedTopics = topics.filter((t) => t.topic === specificTopic);
        if (selectedTopics.length === 0) {
            console.error(`Topic "${specificTopic}" not found. Available topics:`);
            topics.forEach((t) => console.log(`  - ${t.topic}`));
            process.exit(1);
        }
    }
    if (limit) {
        selectedTopics = selectedTopics.slice(0, limit);
    }
    const experimentName = `experiment-${new Date().toISOString().split("T")[0]}-${Date.now()}`;
    await runExperiment(experimentName, selectedTopics, { dryRun, delayMs: delay });
}
// Help text
if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Vapi Agent Conversation Orchestrator

Usage: npm run orchestrate [options]

Options:
  --dry-run       Preview calls without actually making them
  --limit=N       Only run the first N topics
  --topic=NAME    Run only a specific topic
  --delay=MS      Delay between calls in milliseconds (default: 10000)
  --help, -h      Show this help message

Examples:
  npm run orchestrate --dry-run
  npm run orchestrate --limit=5
  npm run orchestrate --topic=customer_support
  npm run orchestrate --delay=15000
  `);
    process.exit(0);
}
main().catch(console.error);
//# sourceMappingURL=index.js.map