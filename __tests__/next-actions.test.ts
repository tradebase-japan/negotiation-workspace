import { describe, expect, it } from "vitest";

import {
  buildNextActionsView,
  computeAutoActions,
  mergeVisibleActions,
  topicToReplyFocus,
} from "@/lib/next-actions";
import { type Deal, type Manufacturer } from "@/lib/schema";

const manufacturer: Manufacturer = {
  id: "m-xfanic",
  name: "Xfanic",
  country: "中国",
  primaryChannel: "wechat",
  contactPerson: "Tracy",
  topics: {
    business_model: { status: "acknowledged", memo: "", chatExcerpt: "", updatedAt: "" },
    crowdfunding: { status: "explained", memo: "", chatExcerpt: "", updatedAt: "" },
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
      memo: "OEM路線",
      chatExcerpt: "",
      updatedAt: "",
    },
    moq: {
      status: "quantity_proposed",
      memo: "MOQ 1000",
      chatExcerpt: "",
      updatedAt: "",
    },
    certification: { status: "checking", memo: "", chatExcerpt: "", updatedAt: "" },
    price: { status: "negotiating", memo: "", chatExcerpt: "", updatedAt: "" },
    schedule: { status: "agreed", memo: "", chatExcerpt: "", updatedAt: "" },
  },
  terms: {
    moq: { value: "", confirmation: "draft", source: "manual" },
    exclusivity: { value: "", confirmation: "draft", source: "manual" },
    certification: { value: "", confirmation: "draft", source: "manual" },
  },
  changeLog: [],
  chatInbox: [],
  attachments: [],
};

describe("next-actions", () => {
  it("puts deal topics before manufacturer topics", () => {
    const actions = computeAutoActions(deal, manufacturer);
    const firstDealIdx = actions.findIndex((a) => a.scope === "deal");
    const firstMfgIdx = actions.findIndex((a) => a.scope === "manufacturer");
    expect(firstDealIdx).toBeGreaterThanOrEqual(0);
    expect(firstMfgIdx).toBeGreaterThan(firstDealIdx);
  });

  it("excludes agreed topics", () => {
    const actions = computeAutoActions(deal, manufacturer);
    expect(actions.some((a) => a.topicId === "schedule")).toBe(false);
    expect(actions.some((a) => a.topicId === "business_model")).toBe(false);
  });

  it("maps topic to reply focus", () => {
    expect(topicToReplyFocus("deal", "moq")).toBe("moq");
    expect(topicToReplyFocus("manufacturer", "business_model")).toBe(
      "business_model",
    );
  });

  it("merges pins before auto actions", () => {
    const view = buildNextActionsView(deal, manufacturer, [
      {
        id: "pin-1",
        text: "サンプル確認",
        completed: false,
        createdAt: "2026-06-29",
      },
    ]);
    expect(view.activePins[0]?.label).toBe("サンプル確認");
    expect(view.autoActions.length).toBeGreaterThan(0);
    const merged = mergeVisibleActions(view, true);
    expect(merged[0]?.kind).toBe("pin");
  });
});
