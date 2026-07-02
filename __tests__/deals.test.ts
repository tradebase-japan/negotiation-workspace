import { describe, it, expect } from "vitest";

import { type Deal } from "@/lib/schema";
import {
  formatChannelLabel,
  getDealProgressLabel,
  getDealProgressSummary,
} from "@/lib/computed/deals";
import { createDefaultDealTopics } from "@/lib/schema";

const baseDeal = (over: Partial<Deal>): Deal => ({
  id: "deal-test",
  manufacturerId: "m1",
  productName: "テスト商品",
  channels: ["wechat"],
  stage: "terms",
  archived: false,
  topics: createDefaultDealTopics(),
  terms: {
    moq: { value: "", confirmation: "draft", source: "manual" },
    exclusivity: { value: "", confirmation: "draft", source: "manual" },
    certification: { value: "", confirmation: "draft", source: "manual" },
  },
  changeLog: [],
  ...over,
});

describe("getDealProgressSummary", () => {
  it("未着手なら 0/5", () => {
    expect(getDealProgressSummary(baseDeal({}))).toBe("0/5");
  });

  it("合意済みトピックをカウントする", () => {
    const topics = createDefaultDealTopics();
    topics.exclusivity = {
      status: "agreed",
      memo: "",
      chatExcerpt: "",
      updatedAt: "",
    };
    expect(getDealProgressSummary(baseDeal({ topics }))).toBe("1/5");
  });
});

describe("getDealProgressLabel", () => {
  it("未着手なら未着手", () => {
    expect(getDealProgressLabel(baseDeal({}))).toBe("未着手");
  });

  it("交渉中トピックがあればそのラベル", () => {
    const topics = createDefaultDealTopics();
    topics.moq = {
      status: "negotiating",
      memo: "",
      chatExcerpt: "",
      updatedAt: "",
    };
    expect(getDealProgressLabel(baseDeal({ topics }))).toBe("交渉中");
  });
});

describe("formatChannelLabel", () => {
  it("WeChat 単体", () => {
    expect(formatChannelLabel(["wechat"])).toBe("WeChat");
  });

  it("両方", () => {
    expect(formatChannelLabel(["line", "wechat"])).toBe("LINE / WeChat");
  });
});
