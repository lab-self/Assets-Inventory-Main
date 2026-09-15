import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { databasePool } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsDirectory = path.resolve(
  __dirname,
  "../../seeds"
);

async function getSeedFiles(): Promise<string[]> {
  const files = await fs.readdir(
    seedsDirectory
  );

  return files
    .filter(
      (filename) =>
        /^\d+_[a-zA-Z0-9_-]+\.sql$/.test(
          filename
        )
    )
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true
      })
    );
}

async function runSeeds(): Promise<void> {
  const seedFiles = await getSeedFiles();

  if (seedFiles.length === 0) {
    console.log("No seed files found.");
    return;
  }

  const client =
    await databasePool.connect();

  try {
    await client.query("BEGIN");

    for (const filename of seedFiles) {
      const seedPath = path.join(
        seedsDirectory,
        filename
      );

      const sql = await fs.readFile(
        seedPath,
        "utf8"
      );

      if (!sql.trim()) {
        throw new Error(
          `Seed file is empty: ${filename}`
        );
      }

      console.log(
        `Running seed: ${filename}`
      );

      await client.query(sql);
    }

    await client.query("COMMIT");

    console.log(
      "Database seed completed successfully."
    );
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  try {
    await runSeeds();
  } catch (error) {
    console.error(
      "Database seed process failed:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await databasePool.end();
  }
}

void main();