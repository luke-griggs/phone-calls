import { neon } from "@neondatabase/serverless";
import { testConnection } from "./client.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
async function migrate() {
    console.log("Testing database connection...");
    const connected = await testConnection();
    if (!connected) {
        console.error("Failed to connect to database. Check DATABASE_URL.");
        process.exit(1);
    }
    console.log("Running migrations...");
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("DATABASE_URL not set");
        process.exit(1);
    }
    // Use tagged template for migrations
    const sql = neon(databaseUrl);
    try {
        const schemaPath = join(__dirname, "schema.sql");
        const schema = readFileSync(schemaPath, "utf-8");
        // Execute the entire schema at once using template literal
        // Neon supports multi-statement execution
        console.log("Executing schema...");
        await sql `${schema}`;
        console.log("Migrations completed successfully!");
    }
    catch (error) {
        // If multi-statement fails, try individual statements
        console.log("Trying individual statements...");
        try {
            const schemaPath = join(__dirname, "schema.sql");
            const schema = readFileSync(schemaPath, "utf-8");
            // Split more carefully, preserving function bodies
            const statements = [];
            let current = "";
            let inFunction = false;
            for (const line of schema.split("\n")) {
                current += line + "\n";
                if (line.includes("$$")) {
                    inFunction = !inFunction;
                }
                if (!inFunction && line.trim().endsWith(";")) {
                    const stmt = current.trim();
                    if (stmt && !stmt.startsWith("--")) {
                        statements.push(stmt);
                    }
                    current = "";
                }
            }
            for (const statement of statements) {
                const preview = statement.substring(0, 50).replace(/\n/g, " ");
                console.log(`Executing: ${preview}...`);
                // Use raw query for DDL statements
                await fetch(databaseUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: statement }),
                });
            }
            console.log("Migrations completed successfully!");
        }
        catch (innerError) {
            console.error("Migration failed:", innerError);
            process.exit(1);
        }
    }
}
migrate();
//# sourceMappingURL=migrate.js.map