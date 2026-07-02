import { describe, it, expect } from "vitest";
import { analyzeChatText } from "@/lib/chat-analyzer";

const XFANIC_SNIPPET = `
Our minimum order quantity is 5000 pieces with unit price $52.
Do not sell products under the brand Xfanic in the Japanese market.
MOQ 1K: USD$52 with custom logo printing.
I've sent the samples via DHL. WAYBILL 69 2142 4646
`;

describe("analyzeChatText", () => {
  it("MOQと独占の候補を拾う", () => {
    const { suggestions } = analyzeChatText(XFANIC_SNIPPET);
    const summaries = suggestions.map((s) => s.summary).join(" ");
    expect(summaries).toMatch(/MOQ/i);
    expect(summaries).toMatch(/独占|Xfanic/i);
  });

  it("空文字は候補なし", () => {
    expect(analyzeChatText("").suggestions).toHaveLength(0);
  });
});
