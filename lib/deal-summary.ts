import { getDealProgressSummary } from "@/lib/computed/deals";
import { CONFIRMATION_LABELS } from "@/lib/labels";
import { TOPIC_STATUS_LABELS } from "@/lib/negotiation-topics";
import { type Deal, type Manufacturer } from "@/lib/schema";

export type SummaryTone = "ok" | "warn" | "bad" | "muted";

export type SummaryCell = {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: SummaryTone;
  topicScope?: "manufacturer" | "deal";
  topicId?: string;
};

function moqSummary(deal: Deal): SummaryCell {
  const term = deal.terms.moq;
  const status = deal.topics.moq?.status ?? "not_started";
  const hasValue = term.value.trim() !== "";

  let value = "—";
  let sub = "未設定";
  let tone: SummaryTone = "muted";

  if (hasValue) {
    value = term.value;
    if (term.confirmation === "confirmed") {
      sub = CONFIRMATION_LABELS.confirmed;
      tone = "ok";
    } else if (term.source === "ai") {
      sub = "要確認（AI抽出）";
      tone = "warn";
    } else {
      sub = CONFIRMATION_LABELS.draft;
      tone = "warn";
    }
  } else if (status !== "not_started") {
    value = TOPIC_STATUS_LABELS[status] ?? status;
    sub = "ステータスのみ";
    tone = status === "zero_ok" ? "ok" : "warn";
  }

  return {
    id: "moq",
    label: "MOQ",
    value,
    sub,
    tone,
    topicScope: "deal",
    topicId: "moq",
  };
}

function zeroMoqSummary(deal: Deal): SummaryCell {
  const status = deal.topics.moq?.status ?? "not_started";

  if (status === "zero_ok") {
    return {
      id: "zero-moq",
      label: "ゼロMOQ",
      value: "0 OK",
      sub: "ゼロMOQ合意",
      tone: "ok",
      topicScope: "deal",
      topicId: "moq",
    };
  }

  return {
    id: "zero-moq",
    label: "ゼロMOQ",
    value: "—",
    sub: status === "not_started" ? "未確認" : "未合意",
    tone: "muted",
    topicScope: "deal",
    topicId: "moq",
  };
}

function exclusivitySummary(deal: Deal): SummaryCell {
  const status = deal.topics.exclusivity?.status ?? "not_started";
  const term = deal.terms.exclusivity;

  if (status === "agreed" || term.confirmation === "confirmed") {
    return {
      id: "exclusivity",
      label: "独占権",
      value: term.value.trim() || "取得済み",
      sub: "合意",
      tone: "ok",
      topicScope: "deal",
      topicId: "exclusivity",
    };
  }

  if (status === "rejected_oem_only") {
    return {
      id: "exclusivity",
      label: "独占権",
      value: "未取得",
      sub: "OEMのみ可",
      tone: "bad",
      topicScope: "deal",
      topicId: "exclusivity",
    };
  }

  if (status === "negotiating" || status === "explained") {
    return {
      id: "exclusivity",
      label: "独占権",
      value: "未取得",
      sub: TOPIC_STATUS_LABELS[status] ?? "交渉中",
      tone: "warn",
      topicScope: "deal",
      topicId: "exclusivity",
    };
  }

  return {
    id: "exclusivity",
    label: "独占権",
    value: "—",
    sub: "未取得",
    tone: "muted",
    topicScope: "deal",
    topicId: "exclusivity",
  };
}

function certificationSummary(deal: Deal): SummaryCell {
  const status = deal.topics.certification?.status ?? "not_started";

  if (status === "holder_ours") {
    return {
      id: "certification",
      label: "認証の持ち",
      value: "当方",
      sub: "自社持ち",
      tone: "ok",
      topicScope: "deal",
      topicId: "certification",
    };
  }

  if (status === "holder_manufacturer") {
    return {
      id: "certification",
      label: "認証の持ち",
      value: "メーカー",
      sub: "メーカー持ち",
      tone: "ok",
      topicScope: "deal",
      topicId: "certification",
    };
  }

  if (status === "holder_shared") {
    return {
      id: "certification",
      label: "認証の持ち",
      value: "共同",
      sub: "共同負担",
      tone: "ok",
      topicScope: "deal",
      topicId: "certification",
    };
  }

  if (status === "checking" || status === "undecided") {
    return {
      id: "certification",
      label: "認証の持ち",
      value: "未決",
      sub: TOPIC_STATUS_LABELS[status] ?? "確認中",
      tone: "warn",
      topicScope: "deal",
      topicId: "certification",
    };
  }

  return {
    id: "certification",
    label: "認証の持ち",
    value: "—",
    sub: "未決",
    tone: "muted",
    topicScope: "deal",
    topicId: "certification",
  };
}

export function buildDealSummary(
  deal: Deal,
  _manufacturer: Manufacturer,
): SummaryCell[] {
  const progress = getDealProgressSummary(deal);

  return [
    moqSummary(deal),
    zeroMoqSummary(deal),
    exclusivitySummary(deal),
    certificationSummary(deal),
    {
      id: "progress",
      label: "進捗",
      value: progress,
      sub: "案件チェック",
      tone: "muted",
    },
  ];
}
