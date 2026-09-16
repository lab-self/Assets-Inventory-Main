import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { databasePool } from "../config/database.js";
import { hashPassword } from "../utils/password.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsDirectory = path.resolve(
  __dirname,
  "../../seeds"
);

async function getSeedFiles(): Promise<string[]> {
  const files = await fs.readdir(seedsDirectory);

  return files
    .filter((filename) => /^\d+_[a-zA-Z0-9_-]+\.sql$/.test(filename))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function runSeeds(): Promise<void> {
  const seedFiles = await getSeedFiles();

  if (seedFiles.length === 0) {
    console.log("No seed files found.");
    return;
  }

  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

    for (const filename of seedFiles) {
      const seedPath = path.join(seedsDirectory, filename);
      const sql = await fs.readFile(seedPath, "utf8");

      if (!sql.trim()) {
        throw new Error(`Seed file is empty: ${filename}`);
      }

      console.log(`Running seed: ${filename}`);
      await client.query(sql);
    }

    await client.query("COMMIT");
    console.log("Database seed completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureAdministrator(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "ADMIN_EMAIL/ADMIN_PASSWORD not configured. Administrator bootstrap skipped."
    );
    return;
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  }

  const existing = await databasePool.query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [email]
  );

  if (existing.rowCount) {
    console.log(`Administrator already exists: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await databasePool.query(
    `INSERT INTO users (
       first_name,
       last_name,
       email,
       password_hash,
       job_title,
       status,
       is_super_admin,
       password_changed_at
     ) VALUES ($1, $2, $3, $4, $5, 'active', TRUE, NOW())`,
    ["System", "Administrator", email, passwordHash, "System Administrator"]
  );

  console.log(`Administrator created successfully: ${email}`);
}

async function main(): Promise<void> {
  try {
    await runSeeds();
    await ensureAdministrator();
  } catch (error) {
    console.error("Database seed process failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await databasePool.end();
  }
}

void main();
