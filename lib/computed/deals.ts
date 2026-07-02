import {
  DEAL_TOPIC_ORDER,
  TOPIC_STATUS_LABELS,
  type DealTopicKey,
} from "@/lib/negotiation-topics";
import { type Deal, type DealTerms } from "@/lib/schema";

const DONE_DEAL_STATUSES = new Set([
  "agreed",
  "acknowledged",
  "zero_ok",
  "holder_ours",
  "holder_manufacturer",
  "holder_shared",
]);

export function getDealProgressSummary(deal: Deal): string {
  const done = DEAL_TOPIC_ORDER.filter((key) => {
    const status = deal.topics[key]?.status ?? "not_started";
    return DONE_DEAL_STATUSES.has(status);
  }).length;
  return `${done}/${DEAL_TOPIC_ORDER.length}`;
}

export function getDealProgressLabel(deal: Deal): string {
  const negotiating = DEAL_TOPIC_ORDER.find((key) => {
    const status = deal.topics[key]?.status ?? "not_started";
    return status !== "not_started" && !DONE_DEAL_STATUSES.has(status);
  });
  if (negotiating) {
    const status = deal.topics[negotiating]?.status ?? "not_started";
    return TOPIC_STATUS_LABELS[status] ?? status;
  }
  const allDone = DEAL_TOPIC_ORDER.every((key) => {
    const status = deal.topics[key]?.status ?? "not_started";
    return DONE_DEAL_STATUSES.has(status);
  });
  if (allDone) return "合意済";
  return "未着手";
}

export function formatChannelLabel(channels: Deal["channels"]): string {
  if (channels.length === 2) return "LINE / WeChat";
  if (channels[0] === "line") return "LINE";
  return "WeChat";
}

export function countConfirmedTerms(terms: DealTerms): number {
  return (["moq", "exclusivity", "certification"] as const).filter(
    (k) => terms[k].confirmation === "confirmed" && terms[k].value !== "",
  ).length;
}

export function getActiveNegotiationTopic(deal: Deal): DealTopicKey | null {
  for (const key of DEAL_TOPIC_ORDER) {
    const status = deal.topics[key]?.status ?? "not_started";
    if (status !== "not_started" && !DONE_DEAL_STATUSES.has(status)) {
      return key;
    }
  }
  return null;
}
