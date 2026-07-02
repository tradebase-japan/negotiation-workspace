import { describe, it, expect } from "vitest";

import {
  candidatesSchema,
  departmentsSchema,
  manufacturersDataSchema,
  workspaceSchema,
} from "@/lib/schema";

import positionsData from "@/data/positions.json";
import manufacturersData from "@/data/manufacturers.json";
import dealsData from "@/data/candidates.json";
import workspaceData from "@/data/workspace.json";

describe("data/*.json schema validation", () => {
  it("data/positions.json は departmentsSchema を満たす", () => {
    const result = departmentsSchema.safeParse(positionsData);
    expect(result.success).toBe(true);
  });

  it("data/manufacturers.json は manufacturersDataSchema を満たす", () => {
    const result = manufacturersDataSchema.safeParse(manufacturersData);
    expect(result.success).toBe(true);
  });

  it("data/candidates.json は candidatesSchema を満たす", () => {
    const result = candidatesSchema.safeParse(dealsData);
    expect(result.success).toBe(true);
  });

  it("data/workspace.json は workspaceSchema を満たす", () => {
    const result = workspaceSchema.safeParse(workspaceData);
    expect(result.success).toBe(true);
  });
});

describe("schema rejects invalid data", () => {
  it("departmentsSchema は配列を期待する", () => {
    expect(departmentsSchema.safeParse({}).success).toBe(false);
    expect(departmentsSchema.safeParse(null).success).toBe(false);
  });

  it("deal は stage が DealStageKey でないと不可", () => {
    expect(
      candidatesSchema.safeParse([
        {
          id: "x",
          manufacturerId: "m1",
          productName: "test",
          channels: ["wechat"],
          stage: "invalid",
          topics: {},
          terms: {
            moq: { value: "", confirmation: "draft", source: "manual" },
            exclusivity: { value: "", confirmation: "draft", source: "manual" },
            certification: { value: "", confirmation: "draft", source: "manual" },
          },
        },
      ]).success,
    ).toBe(false);
  });
});
