import { neon } from "@neondatabase/serverless";

let schemaReady: Promise<void> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(url);
}

export async function ensureSchema(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS workspace_state (
          id TEXT PRIMARY KEY DEFAULT 'default',
          deals JSONB NOT NULL DEFAULT '[]'::jsonb,
          manufacturers JSONB NOT NULL DEFAULT '[]'::jsonb,
          regions JSONB NOT NULL DEFAULT '[]'::jsonb,
          selected_manufacturer_id TEXT NOT NULL DEFAULT '',
          selected_deal_id TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })();
  }
  await schemaReady;
}
