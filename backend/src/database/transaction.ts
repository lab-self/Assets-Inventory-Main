import type { PoolClient } from "pg";
import { databasePool } from "../config/database.js";

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

    try {
      const result = await callback(client);

      await client.query("COMMIT");

      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
  }
}