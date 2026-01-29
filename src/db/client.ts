import { neon, neonConfig } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

// Configure neon for serverless environments
neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const sql = neon(databaseUrl);

export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
