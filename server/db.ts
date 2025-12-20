import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
  );
}

// Parse Supabase URL to extract connection details
const urlObj = new URL(supabaseUrl);
const projectId = urlObj.hostname.split('.')[0];

// Create connection string for Supabase
const connectionString = `postgresql://postgres.${projectId}:${supabaseServiceRoleKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
