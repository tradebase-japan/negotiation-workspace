import { describe, expect, it } from "vitest";

import { analyzeChatText } from "@/lib/chat-analyzer";
import {
  extractTopicExcerpt,
  resolveSuggestionExcerpt,
  stripInboxSourceLabel,
} from "@/lib/chat-excerpt";

const BULK_TRANSCRIPT = `[テキスト: 12番_トーク履歴_文字起こし.txt]

確認日 : 2026年7月1日
元ファイル : 12番 トーク履歴.pdf

====================
ページ 1
====================
9:40 Trade base & World Pass (3)
Ikou からのメッセージ。AI製品の資料を共有。

6/4 10:33
展示会後に折り返し連絡します。

--- MOQ交渉 (2026/6/16) ---
Our minimum order quantity for units printed with your custom logo is 1,000 pieces:
1. MOQ 1K: USD$52 (w/o PKG), with custom logo printing
2. MOQ 800pcs: USD$53.6 (w/o PKG), no custom logo

--- 独占 (2026/6/9) ---
Do not sell products under the brand Xfanic in the Japanese market.
minimum order quantity is 5000 pieces with unit price $52.

6/29 Tracy
I've sent the samples via DHL, and they are estimated to arrive by July 2.
WAYBILL 69 2142 4646
I've also attached the software installation package for you.

Makuake charges approximately 22% in fees for crowdfunding projects.
`;

describe("chat-excerpt", () => {
  it("strips inbox source label", () => {
    expect(stripInboxSourceLabel(BULK_TRANSCRIPT)).not.toMatch(/^\[テキスト:/);
  });

  it("extracts MOQ section for moq topic", () => {
    const excerpt = extractTopicExcerpt(BULK_TRANSCRIPT, "deal", "moq");
    expect(excerpt).toMatch(/MOQ 1K/i);
    expect(excerpt).not.toMatch(/^9:40/);
  });

  it("extracts exclusivity section", () => {
    const excerpt = extractTopicExcerpt(BULK_TRANSCRIPT, "deal", "exclusivity");
    expect(excerpt).toMatch(/Do not sell/i);
    expect(excerpt).not.toMatch(/MOQ 1K/i);
  });

  it("extracts schedule from DHL block", () => {
    const excerpt = extractTopicExcerpt(BULK_TRANSCRIPT, "deal", "schedule");
    expect(excerpt).toMatch(/DHL|WAYBILL/i);
  });

  it("extracts crowdfunding fee mention for manufacturer topic", () => {
    const excerpt = extractTopicExcerpt(
      BULK_TRANSCRIPT,
      "manufacturer",
      "crowdfunding",
    );
    expect(excerpt).toMatch(/Makuake|22%/i);
  });

  it("analyzeChatText assigns different excerpts per suggestion", () => {
    const { suggestions } = analyzeChatText(BULK_TRANSCRIPT);
    const moq = suggestions.find((s) => s.topicId === "moq");
    const exclusivity = suggestions.find((s) => s.topicId === "exclusivity");
    expect(moq?.excerpt).toBeTruthy();
    expect(exclusivity?.excerpt).toBeTruthy();
    expect(moq?.excerpt).not.toBe(exclusivity?.excerpt);
  });

  it("resolveSuggestionExcerpt prefers topic-specific block over head", () => {
    const resolved = resolveSuggestionExcerpt(
      BULK_TRANSCRIPT,
      "deal",
      "certification",
    );
    expect(resolved).toMatch(/software installation/i);
    expect(resolved).not.toMatch(/^確認日/);
  });
});
