import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const databasePool = new Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,

  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,

  idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,

  ssl: env.DATABASE_SSL
    ? {
        rejectUnauthorized: false
      }
    : false,

  application_name: "inventory-management-backend"
});

databasePool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await databasePool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await databasePool.end();
}