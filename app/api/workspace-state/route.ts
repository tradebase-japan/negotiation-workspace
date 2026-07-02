import { NextResponse } from "next/server";

import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db";
import {
  workspaceStatePayloadSchema,
  workspaceStateSchema,
} from "@/lib/workspace-state";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false, state: null });
  }

  try {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT
        deals,
        manufacturers,
        regions,
        selected_manufacturer_id,
        selected_deal_id,
        updated_at
      FROM workspace_state
      WHERE id = 'default'
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ configured: true, state: null });
    }

    const row = rows[0];
    const parsed = workspaceStateSchema.safeParse({
      deals: row.deals,
      manufacturers: row.manufacturers,
      regions: row.regions,
      selectedManufacturerId: row.selected_manufacturer_id,
      selectedDealId: row.selected_deal_id,
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at ?? ""),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Stored workspace state is invalid" },
        { status: 500 },
      );
    }

    return NextResponse.json({ configured: true, state: parsed.data });
  } catch (error) {
    console.error("GET /api/workspace-state failed", error);
    return NextResponse.json(
      { error: "Failed to load workspace state" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = workspaceStatePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    await ensureSchema();
    const sql = getSql();
    const data = parsed.data;

    await sql`
      INSERT INTO workspace_state (
        id,
        deals,
        manufacturers,
        regions,
        selected_manufacturer_id,
        selected_deal_id,
        updated_at
      )
      VALUES (
        'default',
        ${JSON.stringify(data.deals)}::jsonb,
        ${JSON.stringify(data.manufacturers)}::jsonb,
        ${JSON.stringify(data.regions)}::jsonb,
        ${data.selectedManufacturerId},
        ${data.selectedDealId},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        deals = EXCLUDED.deals,
        manufacturers = EXCLUDED.manufacturers,
        regions = EXCLUDED.regions,
        selected_manufacturer_id = EXCLUDED.selected_manufacturer_id,
        selected_deal_id = EXCLUDED.selected_deal_id,
        updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/workspace-state failed", error);
    return NextResponse.json(
      { error: "Failed to save workspace state" },
      { status: 500 },
    );
  }
}
