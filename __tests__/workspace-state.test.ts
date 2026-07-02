import { describe, expect, it } from "vitest";

import dealsData from "@/data/candidates.json";
import manufacturersData from "@/data/manufacturers.json";
import positionsData from "@/data/positions.json";
import {
  workspaceStatePayloadSchema,
  workspaceStateSchema,
} from "@/lib/workspace-state";

describe("workspaceStateSchema", () => {
  it("accepts sample workspace payload", () => {
    const result = workspaceStatePayloadSchema.safeParse({
      deals: dealsData,
      manufacturers: manufacturersData,
      regions: positionsData,
      selectedManufacturerId: "m-xfanic",
      selectedDealId: "deal-xfanic-5019d",
    });

    expect(result.success).toBe(true);
  });

  it("accepts persisted row with updatedAt", () => {
    const result = workspaceStateSchema.safeParse({
      deals: dealsData,
      manufacturers: manufacturersData,
      regions: positionsData,
      selectedManufacturerId: "m-xfanic",
      selectedDealId: "deal-xfanic-5019d",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });
});
