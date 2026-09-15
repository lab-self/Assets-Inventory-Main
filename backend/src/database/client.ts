import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { databasePool } from "../config/database.js";

export type DatabaseClient = typeof databasePool;
export type DatabaseConnection = PoolClient;

export async function query<
  T extends QueryResultRow = QueryResultRow
>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return databasePool.query<T>(text, values);
}

export async function getConnection(): Promise<DatabaseConnection> {
  return databasePool.connect();
}

export async function healthCheck(): Promise<void> {
  await databasePool.query("SELECT 1");
}