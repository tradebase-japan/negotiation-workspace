"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Pane4Toggle } from "@/components/workspace/Pane4Toggle";
import {
  type Deal,
  type Manufacturer,
  type SelectedDetail,
  type DealTerms,
} from "@/lib/schema";
import {
  getTopicLabel,
  getStatusOptions,
  TOPIC_TEMPLATES,
  TOPIC_STATUS_LABELS,
  isDealTopic,
} from "@/lib/negotiation-topics";
import {
  CONFIRMATION_LABELS,
  PANE4_SECTION_IDS,
  TERM_FIELD_LABELS,
} from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InlineTextareaField,
  InlineTextField,
  InlineFieldRow,
} from "@/components/primitives";
import { Pane4Section } from "@/components/workspace/Pane4Section";
import { ChatExcerptField } from "@/components/workspace/ChatExcerptField";

function CopyTemplateButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="size-3.5" aria-hidden />
          コピー済み
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden />
          テンプレをコピー
        </>
      )}
    </Button>
  );
}

function TopicDetail({
  deal,
  manufacturer,
  selectedDetail,
  onUpdateDealTopic,
  onUpdateManufacturerTopic,
  onUpdateDealTerms,
  onConfirmDealTerm,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  selectedDetail: Extract<SelectedDetail, { type: "topic" }>;
  onUpdateDealTopic: (
    dealId: string,
    topicId: string,
    patch: Partial<Deal["topics"][string]>,
  ) => void;
  onUpdateManufacturerTopic: (
    manufacturerId: string,
    topicId: string,
    patch: Partial<Manufacturer["topics"][string]>,
  ) => void;
  onUpdateDealTerms: (
    dealId: string,
    field: keyof DealTerms,
    value: string,
  ) => void;
  onConfirmDealTerm: (dealId: string, field: keyof DealTerms) => void;
}) {
  const { scope, topicId } = selectedDetail;
  const progress =
    scope === "manufacturer"
      ? manufacturer.topics[topicId]
      : deal.topics[topicId];
  const status = progress?.status ?? "not_started";
  const statusOptions = getStatusOptions(scope, topicId).map((s) => ({
    value: s,
    label: TOPIC_STATUS_LABELS[s] ?? s,
  }));
  const template = TOPIC_TEMPLATES[topicId as keyof typeof TOPIC_TEMPLATES] ?? "";

  const updateStatus = (next: string) => {
    if (scope === "manufacturer") {
      onUpdateManufacturerTopic(manufacturer.id, topicId, { status: next });
    } else {
      onUpdateDealTopic(deal.id, topicId, { status: next });
    }
  };

  const updateMemo = (memo: string) => {
    if (scope === "manufacturer") {
      onUpdateManufacturerTopic(manufacturer.id, topicId, { memo });
    } else {
      onUpdateDealTopic(deal.id, topicId, { memo });
    }
  };

  const updateChat = useCallback(
    (chatExcerpt: string) => {
      if (scope === "manufacturer") {
        onUpdateManufacturerTopic(manufacturer.id, topicId, { chatExcerpt });
      } else {
        onUpdateDealTopic(deal.id, topicId, { chatExcerpt });
      }
    },
    [
      scope,
      manufacturer.id,
      deal.id,
      topicId,
      onUpdateManufacturerTopic,
      onUpdateDealTopic,
    ],
  );

  const linkedTermField =
    scope === "deal" && isDealTopic(topicId)
      ? topicId === "moq" || topicId === "exclusivity" || topicId === "certification"
        ? topicId
        : null
      : null;

  return (
    <div className="flex flex-col gap-0 px-4 py-4">
      <Pane4Section id={PANE4_SECTION_IDS.status} title="ステータス">
        <InlineFieldRow label="進捗">
          <Select value={status} onValueChange={(v) => updateStatus(v ?? status)}>
            <SelectTrigger
              aria-label="交渉ステータス"
              className="h-8 w-full bg-card hover:bg-accent/40"
            >
              <SelectValue>{TOPIC_STATUS_LABELS[status] ?? status}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InlineFieldRow>
      </Pane4Section>

      {template && (
        <>
          <Separator />
          <Pane4Section id={PANE4_SECTION_IDS.template} title="送付テンプレ">
            <div className="flex flex-col gap-3">
              <CopyTemplateButton text={template} />
              <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                {template}
              </pre>
            </div>
          </Pane4Section>
        </>
      )}

      <Separator />

      <Pane4Section id={PANE4_SECTION_IDS.chat} title="トーク貼付・メモ">
        <div className="flex flex-col gap-3">
          <InlineFieldRow label="メモ">
            <InlineTextareaField
              value={progress?.memo ?? ""}
              onSave={updateMemo}
              ariaLabel="メモ"
            />
          </InlineFieldRow>
          <InlineFieldRow label="トーク抜粋（日本語）">
            <ChatExcerptField
              value={progress?.chatExcerpt ?? ""}
              onSave={updateChat}
            />
          </InlineFieldRow>
        </div>
      </Pane4Section>

      {linkedTermField && (
        <>
          <Separator />
          <Pane4Section id={PANE4_SECTION_IDS.terms} title="確定値">
            <div className="flex flex-col gap-3">
              <InlineFieldRow label={TERM_FIELD_LABELS[linkedTermField]}>
                <InlineTextField
                  value={deal.terms[linkedTermField].value}
                  onSave={(v) => onUpdateDealTerms(deal.id, linkedTermField, v)}
                  ariaLabel={TERM_FIELD_LABELS[linkedTermField]}
                />
              </InlineFieldRow>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    deal.terms[linkedTermField].confirmation === "confirmed"
                      ? "default"
                      : "secondary"
                  }
                  size="xs"
                >
                  {CONFIRMATION_LABELS[deal.terms[linkedTermField].confirmation]}
                </Badge>
                {deal.terms[linkedTermField].confirmation !== "confirmed" &&
                  deal.terms[linkedTermField].value.trim() !== "" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => onConfirmDealTerm(deal.id, linkedTermField)}
                    >
                      確定する
                    </Button>
                  )}
              </div>
            </div>
          </Pane4Section>
        </>
      )}

    </div>
  );
}

export function CandidateDetailPane({
  deal,
  manufacturer,
  selectedDetail,
  scrollAnchor,
  onScrollAnchorConsumed,
  onUpdateDealTopic,
  onUpdateManufacturerTopic,
  onUpdateDealTerms,
  onConfirmDealTerm,
  pane4Open,
  onTogglePane4,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  selectedDetail: SelectedDetail;
  scrollAnchor: string | null;
  onScrollAnchorConsumed: () => void;
  onUpdateDealTopic: (
    dealId: string,
    topicId: string,
    patch: Partial<Deal["topics"][string]>,
  ) => void;
  onUpdateManufacturerTopic: (
    manufacturerId: string,
    topicId: string,
    patch: Partial<Manufacturer["topics"][string]>,
  ) => void;
  onUpdateDealTerms: (
    dealId: string,
    field: keyof DealTerms,
    value: string,
  ) => void;
  onConfirmDealTerm: (dealId: string, field: keyof DealTerms) => void;
  pane4Open: boolean;
  onTogglePane4: () => void;
}) {
  useEffect(() => {
    if (!scrollAnchor) return;
    const id = requestAnimationFrame(() => {
      document
        .getElementById(scrollAnchor)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
      onScrollAnchorConsumed();
    });
    return () => cancelAnimationFrame(id);
  }, [scrollAnchor, onScrollAnchorConsumed]);

  const heading =
    selectedDetail?.type === "topic"
      ? getTopicLabel(selectedDetail.scope, selectedDetail.topicId)
      : "交渉詳細";

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-border bg-card",
        "transition-[width] duration-200 ease-linear",
        pane4Open ? "w-[min(360px,32vw)]" : "w-12",
      )}
    >
      {pane4Open ? (
        <>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
            <h2 className="flex-1 truncate text-sm font-semibold text-foreground">
              {heading}
            </h2>
            <Pane4Toggle open={pane4Open} onToggle={onTogglePane4} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {selectedDetail?.type === "topic" && (
              <TopicDetail
                key={`${deal.id}-${selectedDetail.scope}-${selectedDetail.topicId}`}
                deal={deal}
                manufacturer={manufacturer}
                selectedDetail={selectedDetail}
                onUpdateDealTopic={onUpdateDealTopic}
                onUpdateManufacturerTopic={onUpdateManufacturerTopic}
                onUpdateDealTerms={onUpdateDealTerms}
                onConfirmDealTerm={onConfirmDealTerm}
              />
            )}
          </div>
        </>
      ) : (
        <div className="flex h-12 shrink-0 items-center justify-center border-b border-border">
          <Pane4Toggle open={pane4Open} onToggle={onTogglePane4} />
        </div>
      )}
    </aside>
  );
}
