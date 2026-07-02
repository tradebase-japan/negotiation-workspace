import { getAttachmentTextContent } from "@/lib/attachment-text";
import {
  DEAL_TOPIC_ORDER,
  MANUFACTURER_TOPIC_ORDER,
  TOPIC_STATUS_LABELS,
  getTopicLabel,
} from "@/lib/negotiation-topics";
import { type Deal, type Manufacturer } from "@/lib/schema";
import { formatChannelLabel } from "@/lib/computed/deals";
import { TERM_FIELD_LABELS } from "@/lib/labels";

export const MAX_REPLY_CHAT_CHARS = 14_000;

export type ReplyDraftFocus =
  | "general"
  | "exclusivity"
  | "moq"
  | "certification"
  | "price"
  | "schedule"
  | "business_model"
  | "crowdfunding";

export type ReplyDraftRequest = {
  manufacturerName: string;
  productName: string;
  contactPerson?: string;
  channel: string;
  userIntent: string;
  focusTopic: ReplyDraftFocus;
  checklistSummary: string;
  confirmedTerms: string;
  chatHistory: string;
  refinement?: string;
  previousDraft?: string;
};

export type ReplyDraftResult = {
  strategyNotes: string;
  draftEnglish: string;
  draftJapaneseSummary: string;
  cautions: string[];
};

export function buildReplyAssistPayload(
  deal: Deal,
  manufacturer: Manufacturer,
  options: {
    userIntent?: string;
    focusTopic?: ReplyDraftFocus;
    refinement?: string;
    previousDraft?: string;
  } = {},
): ReplyDraftRequest {
  return {
    manufacturerName: manufacturer.name,
    productName: deal.productName,
    contactPerson: manufacturer.contactPerson || undefined,
    channel: formatChannelLabel(deal.channels),
    userIntent: options.userIntent?.trim() ?? "",
    focusTopic: options.focusTopic ?? "general",
    checklistSummary: buildChecklistSummary(deal, manufacturer),
    confirmedTerms: buildConfirmedTermsSummary(deal),
    chatHistory: collectChatHistory(deal),
    refinement: options.refinement?.trim() || undefined,
    previousDraft: options.previousDraft?.trim() || undefined,
  };
}

export function buildChecklistSummary(
  deal: Deal,
  manufacturer: Manufacturer,
): string {
  const manufacturerLines = MANUFACTURER_TOPIC_ORDER.map((topicId) => {
    const progress = manufacturer.topics[topicId];
    const status = progress?.status ?? "not_started";
    const label = getTopicLabel("manufacturer", topicId);
    const statusLabel = TOPIC_STATUS_LABELS[status] ?? status;
    const memo = progress?.memo?.trim();
    return `- ${label}: ${statusLabel}${memo ? `（${memo}）` : ""}`;
  });

  const dealLines = DEAL_TOPIC_ORDER.map((topicId) => {
    const progress = deal.topics[topicId];
    const status = progress?.status ?? "not_started";
    const label = getTopicLabel("deal", topicId);
    const statusLabel = TOPIC_STATUS_LABELS[status] ?? status;
    const memo = progress?.memo?.trim();
    return `- ${label}: ${statusLabel}${memo ? `（${memo}）` : ""}`;
  });

  return [
    "【メーカー共通】",
    ...manufacturerLines,
    "",
    "【案件の交渉項目】",
    ...dealLines,
  ].join("\n");
}

export function buildConfirmedTermsSummary(deal: Deal): string {
  const fields = ["moq", "exclusivity", "certification"] as const;
  return fields
    .map((field) => {
      const term = deal.terms[field];
      const value = term.value.trim() || "未設定";
      return `- ${TERM_FIELD_LABELS[field]}: ${value}（${term.confirmation === "confirmed" ? "確定" : "要確認"}）`;
    })
    .join("\n");
}

export function collectChatHistory(deal: Deal): string {
  const parts: string[] = [];

  if (deal.chatInbox.length > 0) {
    for (const entry of deal.chatInbox) {
      parts.push(`--- ${entry.pastedAt} ---\n${entry.content}`);
    }
  } else {
    for (const topicId of DEAL_TOPIC_ORDER) {
      const excerpt = deal.topics[topicId]?.chatExcerpt?.trim();
      if (excerpt) {
        parts.push(
          `--- ${getTopicLabel("deal", topicId)} ---\n${excerpt}`,
        );
      }
    }
  }

  for (const attachment of deal.attachments) {
    if (attachment.kind === "image") continue;
    const text = getAttachmentTextContent(attachment).trim();
    if (text.length > 100) {
      parts.push(`--- 添付: ${attachment.name} ---\n${text}`);
    }
  }

  const combined = parts.join("\n\n");
  if (combined.length <= MAX_REPLY_CHAT_CHARS) return combined;
  return `[…末尾 ${MAX_REPLY_CHAT_CHARS} 文字]\n${combined.slice(-MAX_REPLY_CHAT_CHARS)}`;
}

export async function requestReplyDraft(
  payload: ReplyDraftRequest,
): Promise<ReplyDraftResult> {
  const response = await fetch("/api/reply-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ReplyDraftResult & {
    error?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "返信案の生成に失敗しました");
  }

  return data;
}
