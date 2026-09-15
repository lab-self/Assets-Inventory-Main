import type {
  PoolClient,
  QueryResult,
  QueryResultRow
} from "pg";

import { query as executeQuery } from "./client.js";

export async function execute<
  T extends QueryResultRow = QueryResultRow
>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return executeQuery<T>(text, values);
}

export async function executeWithClient<
  T extends QueryResultRow = QueryResultRow
>(
  client: PoolClient,
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return client.query<T>(text, values);
}

export async function findOne<
  T extends QueryResultRow = QueryResultRow
>(
  text: string,
  values:  unknown[] = []
): Promise<T | null> {
  const result = await execute<T>(text, values);

  return result.rows[0] ?? null;
}

export async function findMany<
  T extends QueryResultRow = QueryResultRow
>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const result = await execute<T>(text, values);

  return result.rows;
}

export async function executeWithAffectedRows(
  text: string,
  values: unknown[] = []
): Promise<number> {
  const result = await execute(text, values);

  return result.rowCount ?? 0;
}