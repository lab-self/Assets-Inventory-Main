import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";
import { databasePool } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDirectory = path.resolve(
  __dirname,
  "../../migrations"
);

interface MigrationFile {
  filename: string;
  version: number;
}

function parseMigrationFilename(filename: string): MigrationFile | null {
  const match = filename.match(/^(\d+)_([a-zA-Z0-9_-]+)\.sql$/);

  if (!match) {
    return null;
  }

  const version = Number(match[1]);

  if (!Number.isSafeInteger(version)) {
    return null;
  }

  return {
    filename,
    version
  };
}

async function getMigrationFiles(): Promise<MigrationFile[]> {
  const files = await fs.readdir(migrationsDirectory);

  const migrations = files
    .map(parseMigrationFilename)
    .filter(
      (migration): migration is MigrationFile => migration !== null
    )
    .sort((a, b) => a.version - b.version);

  const versions = new Set<number>();

  for (const migration of migrations) {
    if (versions.has(migration.version)) {
      throw new Error(
        `Duplicate migration version detected: ${migration.version}`
      );
    }

    versions.add(migration.version);
  }

  return migrations;
}

async function ensureMigrationTable(
  client: PoolClient
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version BIGINT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(
  client: PoolClient
): Promise<Set<number>> {
  const result = await client.query<{ version: string }>(`
    SELECT version
    FROM schema_migrations
    ORDER BY version ASC;
  `);

  return new Set(
    result.rows.map((row) => Number(row.version))
  );
}

async function applyMigration(
  client: PoolClient,
  migration: MigrationFile
): Promise<void> {
  const migrationPath = path.join(
    migrationsDirectory,
    migration.filename
  );

  const sql = await fs.readFile(
    migrationPath,
    "utf8"
  );

  if (!sql.trim()) {
    throw new Error(
      `Migration is empty: ${migration.filename}`
    );
  }

  await client.query("BEGIN");

  try {
    await client.query(sql);

    await client.query(
      `
        INSERT INTO schema_migrations (
          version,
          filename
        )
        VALUES ($1, $2);
      `,
      [
        migration.version,
        migration.filename
      ]
    );

    await client.query("COMMIT");

    console.log(
      `Migration applied: ${migration.filename}`
    );
  } catch (error) {
    await client.query("ROLLBACK");

    throw new Error(
      `Migration failed: ${migration.filename}`,
      {
        cause: error
      }
    );
  }
}

async function showMigrationStatus(
  client: PoolClient,
  migrations: MigrationFile[]
): Promise<void> {
  const applied = await getAppliedMigrations(client);

  if (migrations.length === 0) {
    console.log("No migration files found.");
    return;
  }

  console.log("\nDatabase migration status:\n");

  for (const migration of migrations) {
    const status = applied.has(migration.version)
      ? "APPLIED"
      : "PENDING";

    console.log(
      `${String(migration.version).padStart(4, "0")}  ${status.padEnd(7)}  ${migration.filename}`
    );
  }

  console.log("");
}

async function runMigrations(): Promise<void> {
  const client = await databasePool.connect();

  try {
    await ensureMigrationTable(client);

    const migrations = await getMigrationFiles();

    if (process.argv.includes("--status")) {
      await showMigrationStatus(
        client,
        migrations
      );

      return;
    }

    const appliedMigrations =
      await getAppliedMigrations(client);

    const pendingMigrations =
      migrations.filter(
        (migration) =>
          !appliedMigrations.has(
            migration.version
          )
      );

    if (pendingMigrations.length === 0) {
      console.log(
        "Database is already up to date."
      );

      return;
    }

    console.log(
      `Found ${pendingMigrations.length} pending migration(s).`
    );

    for (const migration of pendingMigrations) {
      await applyMigration(
        client,
        migration
      );
    }

    console.log(
      "Database migrations completed successfully."
    );
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  try {
    await runMigrations();
  } catch (error) {
    console.error(
      "Database migration process failed:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await databasePool.end();
  }
}

void main();