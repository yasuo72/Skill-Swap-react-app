import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for better connection handling
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_EobgQws7efX4@ep-noisy-darkness-a1gzwawc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with better settings for Neon
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for new connections
  maxUses: 7500, // Close connections after 7500 uses (Neon recommendation)
});

export const db = drizzle({ client: pool, schema });