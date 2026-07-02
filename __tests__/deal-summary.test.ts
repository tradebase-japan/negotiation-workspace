import { describe, expect, it } from "vitest";

import dealsData from "@/data/candidates.json";
import manufacturersData from "@/data/manufacturers.json";
import { buildDealSummary } from "@/lib/deal-summary";
import { type Deal, type Manufacturer } from "@/lib/schema";

describe("buildDealSummary", () => {
  const deal = dealsData[0] as Deal;
  const manufacturer = manufacturersData.find(
    (m) => m.id === deal.manufacturerId,
  ) as Manufacturer;

  it("returns key summary cells", () => {
    const cells = buildDealSummary(deal, manufacturer);
    expect(cells.map((c) => c.id)).toEqual([
      "moq",
      "zero-moq",
      "exclusivity",
      "certification",
      "progress",
    ]);
  });

  it("reflects zero_ok MOQ status", () => {
    const custom: Deal = {
      ...deal,
      topics: {
        ...deal.topics,
        moq: {
          status: "zero_ok",
          memo: "",
          chatExcerpt: "",
          updatedAt: "",
        },
      },
    };
    const zero = buildDealSummary(custom, manufacturer).find(
      (c) => c.id === "zero-moq",
    );
    expect(zero?.value).toBe("0 OK");
    expect(zero?.tone).toBe("ok");
  });
});
