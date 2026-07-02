import { describe, expect, it } from "vitest";

import {
  buildChecklistSummary,
  buildReplyAssistPayload,
  collectChatHistory,
  MAX_REPLY_CHAT_CHARS,
} from "@/lib/reply-assist";
import { type Deal, type Manufacturer } from "@/lib/schema";

const manufacturer: Manufacturer = {
  id: "m-xfanic",
  name: "Xfanic",
  country: "中国",
  primaryChannel: "wechat",
  contactPerson: "Tracy Zeng",
  topics: {
    business_model: { status: "explained", memo: "", chatExcerpt: "", updatedAt: "" },
    crowdfunding: { status: "acknowledged", memo: "", chatExcerpt: "", updatedAt: "" },
    four_step_channel: { status: "not_started", memo: "", chatExcerpt: "", updatedAt: "" },
    cost_coverage: { status: "not_started", memo: "", chatExcerpt: "", updatedAt: "" },
    pre_marketing: { status: "not_started", memo: "", chatExcerpt: "", updatedAt: "" },
  },
};

const deal: Deal = {
  id: "deal-1",
  manufacturerId: "m-xfanic",
  productName: "SmartView Dock 5019D",
  channels: ["wechat"],
  stage: "terms",
  archived: false,
  topics: {
    exclusivity: {
      status: "rejected_oem_only",
      memo: "Xfanicブランド不可",
      chatExcerpt: "Do not sell under Xfanic brand in Japan.",
      updatedAt: "2026-06-12",
    },
    moq: {
      status: "quantity_proposed",
      memo: "MOQ 1000 @ $52",
      chatExcerpt: "MOQ 1K: USD$52",
      updatedAt: "2026-06-16",
    },
    certification: { status: "checking", memo: "", chatExcerpt: "", updatedAt: "" },
    price: { status: "negotiating", memo: "", chatExcerpt: "", updatedAt: "" },
    schedule: { status: "agreed", memo: "サンプル7/2到着", chatExcerpt: "", updatedAt: "" },
  },
  terms: {
    moq: { value: "1000@$52", confirmation: "draft", source: "chat" },
    exclusivity: { value: "OEM路線", confirmation: "draft", source: "chat" },
    certification: { value: "", confirmation: "draft", source: "manual" },
  },
  changeLog: [],
  chatInbox: [
    {
      id: "inbox-1",
      content: "Hi Hiroki, samples shipped via DHL.",
      pastedAt: "2026-06-29",
      channel: "email",
    },
  ],
  attachments: [],
};

describe("reply-assist", () => {
  it("builds payload with checklist and chat history", () => {
    const payload = buildReplyAssistPayload(deal, manufacturer, {
      userIntent: "サンプル到着のお礼",
      focusTopic: "moq",
    });

    expect(payload.manufacturerName).toBe("Xfanic");
    expect(payload.userIntent).toBe("サンプル到着のお礼");
    expect(payload.focusTopic).toBe("moq");
    expect(payload.checklistSummary).toContain("MOQ");
    expect(payload.chatHistory).toContain("samples shipped");
  });

  it("includes topic excerpts when inbox is empty", () => {
    const emptyInboxDeal = { ...deal, chatInbox: [] };
    const history = collectChatHistory(emptyInboxDeal);
    expect(history).toContain("Do not sell under Xfanic brand");
    expect(history).toContain("MOQ 1K");
  });

  it("truncates very long chat history", () => {
    const longDeal = {
      ...deal,
      chatInbox: [
        {
          id: "long",
          content: "x".repeat(MAX_REPLY_CHAT_CHARS + 500),
          pastedAt: "2026-06-29",
          channel: "other" as const,
        },
      ],
    };
    const history = collectChatHistory(longDeal);
    expect(history.length).toBeLessThanOrEqual(MAX_REPLY_CHAT_CHARS + 40);
    expect(history.startsWith("[…末尾")).toBe(true);
  });

  it("summarizes checklist statuses", () => {
    const summary = buildChecklistSummary(deal, manufacturer);
    expect(summary).toContain("独占性");
    expect(summary).toContain("NG（OEMのみ可）");
  });
});
