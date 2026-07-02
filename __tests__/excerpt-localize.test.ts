import { describe, expect, it } from "vitest";

import { isMostlyEnglish } from "@/lib/excerpt-localize";

describe("isMostlyEnglish", () => {
  it("detects English negotiation excerpt", () => {
    expect(
      isMostlyEnglish(
        "MOQ 500pcs for first order. Do not sell under our brand in Japan.",
      ),
    ).toBe(true);
  });

  it("skips mostly Japanese text", () => {
    expect(
      isMostlyEnglish("初回注文のMOQは500個で合意しました。日本国内の独占について確認中です。"),
    ).toBe(false);
  });

  it("skips very short strings", () => {
    expect(isMostlyEnglish("OK")).toBe(false);
  });
});
