import {
  DEAL_TOPIC_ORDER,
  MANUFACTURER_TOPIC_ORDER,
  TOPIC_STATUS_LABELS,
  getTopicLabel,
  type DealTopicKey,
  type ManufacturerTopicKey,
} from "@/lib/negotiation-topics";
import { type ReplyDraftFocus } from "@/lib/reply-assist";
import { type Deal, type Manufacturer } from "@/lib/schema";

export const NEXT_ACTIONS_STORAGE_PREFIX = "negotiation-pins-";
export const DEFAULT_VISIBLE_ACTIONS = 8;

const DONE_STATUSES = new Set([
  "agreed",
  "acknowledged",
  "zero_ok",
  "holder_ours",
  "holder_manufacturer",
  "holder_shared",
]);

const URGENT_STATUSES = new Set([
  "no_response",
  "negotiating",
  "checking",
  "quantity_proposed",
  "rejected_oem_only",
  "pending",
  "rejected",
  "explained",
]);

export type NextActionKind = "auto" | "pin";

export type NextActionItem = {
  id: string;
  kind: NextActionKind;
  scope?: "manufacturer" | "deal";
  topicId?: string;
  label: string;
  statusLabel?: string;
  memo?: string;
  priority: number;
  replyFocus: ReplyDraftFocus;
};

export type PinnedAction = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

const DEAL_TOPIC_REPLY_FOCUS: Record<DealTopicKey, ReplyDraftFocus> = {
  exclusivity: "exclusivity",
  moq: "moq",
  certification: "certification",
  price: "price",
  schedule: "schedule",
};

const MANUFACTURER_TOPIC_REPLY_FOCUS: Partial<
  Record<ManufacturerTopicKey, ReplyDraftFocus>
> = {
  business_model: "business_model",
  crowdfunding: "crowdfunding",
};

export function topicToReplyFocus(
  scope: "manufacturer" | "deal",
  topicId: string,
): ReplyDraftFocus {
  if (scope === "deal" && DEAL_TOPIC_ORDER.includes(topicId as DealTopicKey)) {
    return DEAL_TOPIC_REPLY_FOCUS[topicId as DealTopicKey];
  }
  if (
    scope === "manufacturer" &&
    MANUFACTURER_TOPIC_ORDER.includes(topicId as ManufacturerTopicKey)
  ) {
    return (
      MANUFACTURER_TOPIC_REPLY_FOCUS[topicId as ManufacturerTopicKey] ??
      "general"
    );
  }
  return "general";
}

function statusPriority(status: string): number {
  if (URGENT_STATUSES.has(status)) return 1;
  if (status === "not_started") return 2;
  return 99;
}

function buildAutoAction(
  scope: "manufacturer" | "deal",
  topicId: string,
  status: string,
  memo?: string,
): NextActionItem | null {
  if (DONE_STATUSES.has(status)) return null;

  const priority = scope === "deal" ? 0 : 10;
  const statusPri = statusPriority(status);
  if (statusPri >= 99) return null;

  return {
    id: `auto-${scope}-${topicId}`,
    kind: "auto",
    scope,
    topicId,
    label: getTopicLabel(scope, topicId),
    statusLabel: TOPIC_STATUS_LABELS[status] ?? status,
    memo: memo?.trim() || undefined,
    priority: priority + statusPri,
    replyFocus: topicToReplyFocus(scope, topicId),
  };
}

export function computeAutoActions(
  deal: Deal,
  manufacturer: Manufacturer,
): NextActionItem[] {
  const items: NextActionItem[] = [];

  for (const topicId of DEAL_TOPIC_ORDER) {
    const progress = deal.topics[topicId];
    const status = progress?.status ?? "not_started";
    const action = buildAutoAction(
      "deal",
      topicId,
      status,
      progress?.memo,
    );
    if (action) items.push(action);
  }

  for (const topicId of MANUFACTURER_TOPIC_ORDER) {
    const progress = manufacturer.topics[topicId];
    const status = progress?.status ?? "not_started";
    const action = buildAutoAction(
      "manufacturer",
      topicId,
      status,
      progress?.memo,
    );
    if (action) items.push(action);
  }

  return items.sort((a, b) => a.priority - b.priority);
}

export function pinToAction(pin: PinnedAction): NextActionItem {
  return {
    id: pin.id,
    kind: "pin",
    label: pin.text,
    priority: 5,
    replyFocus: "general",
  };
}

export function loadPinnedActions(dealId: string): PinnedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${NEXT_ACTIONS_STORAGE_PREFIX}${dealId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PinnedAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePinnedActions(dealId: string, pins: PinnedAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${NEXT_ACTIONS_STORAGE_PREFIX}${dealId}`,
      JSON.stringify(pins),
    );
  } catch {
    // quota exceeded etc.
  }
}

export function createPinnedAction(text: string): PinnedAction {
  return {
    id: `pin-${Date.now()}`,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
}

export type NextActionsView = {
  activePins: NextActionItem[];
  autoActions: NextActionItem[];
  completedPins: PinnedAction[];
};

export function buildNextActionsView(
  deal: Deal,
  manufacturer: Manufacturer,
  pins: PinnedAction[],
): NextActionsView {
  const activePins = pins
    .filter((p) => !p.completed)
    .map(pinToAction)
    .sort((a, b) => a.priority - b.priority);

  const autoActions = computeAutoActions(deal, manufacturer);
  const completedPins = pins.filter((p) => p.completed);

  return { activePins, autoActions, completedPins };
}

export function mergeVisibleActions(
  view: NextActionsView,
  showAll: boolean,
): NextActionItem[] {
  const merged = [...view.activePins, ...view.autoActions];
  if (showAll || merged.length <= DEFAULT_VISIBLE_ACTIONS) return merged;
  return merged.slice(0, DEFAULT_VISIBLE_ACTIONS);
}
