import { neon } from "@neondatabase/serverless";

let sql = null;

// Lazily creates a single tagged-template SQL client, reused across calls
// within the same serverless function instance. The connection string is
// only required at first use, not at module load, so this file can be
// imported safely even before DATABASE_URL is configured.
export function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Missing DATABASE_URL environment variable");
    }

    sql = neon(connectionString);
  }

  return sql;
}
