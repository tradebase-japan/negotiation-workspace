"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Circle, CircleDot } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  type Deal,
  type Manufacturer,
  type SelectedDetail,
} from "@/lib/schema";
import {
  DEAL_TOPIC_ORDER,
  MANUFACTURER_TOPIC_ORDER,
  TOPIC_STATUS_LABELS,
  getTopicLabel,
} from "@/lib/negotiation-topics";
import {
  CONFIRMATION_LABELS,
  PANE3_SECTION,
  PANE4_SECTION_IDS,
  SOURCE_LABELS,
  TERM_FIELD_LABELS,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChatInboxCard } from "@/components/workspace/ChatInboxCard";
import { DealAttachmentsCard } from "@/components/workspace/DealAttachmentsCard";
import { NextActionsCard } from "@/components/workspace/NextActionsCard";
import { ReplyAssistCard } from "@/components/workspace/ReplyAssistCard";
import type { ChatAnalysisResult, ChatSuggestion } from "@/lib/chat-analyzer";
import type { ReplyDraftFocus } from "@/lib/reply-assist";

const DONE_STATUSES = new Set([
  "agreed",
  "acknowledged",
  "zero_ok",
  "holder_ours",
  "holder_manufacturer",
  "holder_shared",
]);

function TopicIcon({ status }: { status: string }) {
  if (DONE_STATUSES.has(status)) {
    return (
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-3" aria-hidden />
      </span>
    );
  }
  if (status !== "not_started") {
    return (
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground">
        <CircleDot className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground">
      <Circle className="size-4" aria-hidden />
    </span>
  );
}

function JumpIcon({ selected }: { selected: boolean }) {
  return (
    <ArrowUpRight
      aria-hidden
      className={cn(
        "size-4 shrink-0",
        selected ? "text-primary" : "text-muted-foreground",
      )}
    />
  );
}

function NegotiationChecklistCard({
  deal,
  manufacturer,
  selectedDetail,
  onOpenDetail,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  selectedDetail: SelectedDetail;
  onOpenDetail: (next: SelectedDetail, anchor?: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle emphasis="prominent">
          {PANE3_SECTION.negotiationChecklist}
        </CardTitle>
        <CardDescription>
          {PANE3_SECTION.negotiationChecklistDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {PANE3_SECTION.manufacturerOnboarding}
            </p>
            <div className="flex flex-col gap-1">
              {MANUFACTURER_TOPIC_ORDER.map((topicId, idx) => {
                const progress = manufacturer.topics[topicId];
                const status = progress?.status ?? "not_started";
                const selected =
                  selectedDetail?.type === "topic" &&
                  selectedDetail.scope === "manufacturer" &&
                  selectedDetail.topicId === topicId;
                return (
                  <div key={topicId}>
                    {idx > 0 && <Separator className="my-1" />}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenDetail(
                          { type: "topic", scope: "manufacturer", topicId },
                          PANE4_SECTION_IDS.template,
                        )
                      }
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <TopicIcon status={status} />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {getTopicLabel("manufacturer", topicId)}
                          </span>
                          <Badge variant="outline" size="xs">
                            {TOPIC_STATUS_LABELS[status] ?? status}
                          </Badge>
                        </div>
                        {progress?.memo && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {progress.memo}
                          </p>
                        )}
                      </div>
                      <JumpIcon selected={selected} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              案件の交渉項目
            </p>
            <div className="flex flex-col gap-1">
              {DEAL_TOPIC_ORDER.map((topicId, idx) => {
                const progress = deal.topics[topicId];
                const status = progress?.status ?? "not_started";
                const selected =
                  selectedDetail?.type === "topic" &&
                  selectedDetail.scope === "deal" &&
                  selectedDetail.topicId === topicId;
                return (
                  <div key={topicId}>
                    {idx > 0 && <Separator className="my-1" />}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenDetail(
                          { type: "topic", scope: "deal", topicId },
                          PANE4_SECTION_IDS.template,
                        )
                      }
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <TopicIcon status={status} />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {getTopicLabel("deal", topicId)}
                          </span>
                          <Badge variant="outline" size="xs">
                            {TOPIC_STATUS_LABELS[status] ?? status}
                          </Badge>
                        </div>
                        {progress?.memo && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {progress.memo}
                          </p>
                        )}
                      </div>
                      <JumpIcon selected={selected} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfirmedTermsCard({ deal }: { deal: Deal }) {
  const fields = ["moq", "exclusivity", "certification"] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle emphasis="prominent">{PANE3_SECTION.confirmedTerms}</CardTitle>
        <CardDescription>{PANE3_SECTION.confirmedTermsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3 text-sm">
          {fields.map((field) => {
            const term = deal.terms[field];
            const isConfirmed = term.confirmation === "confirmed";
            return (
              <div
                key={field}
                className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {TERM_FIELD_LABELS[field]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={isConfirmed ? "default" : "secondary"}
                      size="xs"
                    >
                      {CONFIRMATION_LABELS[term.confirmation]}
                    </Badge>
                    <Badge variant="outline" size="xs">
                      {SOURCE_LABELS[term.source]}
                    </Badge>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-sm",
                    term.value
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {term.value || "未設定"}
                </p>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}

export function CandidateDashboardPane({
  deal,
  manufacturer,
  selectedDetail,
  onOpenDetail,
  progressSummary,
  onPasteChat,
  onApplySuggestion,
  onApplyAllSuggestions,
  onAddAttachments,
  onAnalyzeAttachment,
  externalInboxAnalysis,
  onConsumeExternalAnalysis,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  selectedDetail: SelectedDetail;
  onOpenDetail: (next: SelectedDetail, anchor?: string) => void;
  progressSummary: string;
  onPasteChat: (content: string, sourceLabel?: string) => ChatAnalysisResult & {
    entryId: string;
  };
  onApplySuggestion: (
    suggestion: ChatSuggestion,
    inboxEntryId: string,
  ) => void;
  onApplyAllSuggestions: (
    suggestions: ChatSuggestion[],
    inboxEntryId: string,
  ) => void;
  onAddAttachments: (files: FileList) => Promise<void>;
  onAnalyzeAttachment: (attachmentId: string) => void;
  externalInboxAnalysis?: (ChatAnalysisResult & { entryId: string }) | null;
  onConsumeExternalAnalysis?: () => void;
}) {
  const [replyFocusRequest, setReplyFocusRequest] =
    useState<ReplyDraftFocus | null>(null);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
        <h2 className="font-heading truncate text-xl font-semibold text-foreground">
          {deal.productName}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{manufacturer.name}</span>
          <span aria-hidden>·</span>
          <span>進捗 {progressSummary}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain xl:flex-row xl:overflow-hidden">
        {/* やりとり */}
        <div className="flex min-w-0 flex-col xl:min-h-0 xl:min-w-0 xl:flex-1 xl:overflow-hidden xl:border-r xl:border-border">
          <div className="shrink-0 border-b border-border px-4 py-2 sm:px-6">
            <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
              {PANE3_SECTION.workPane}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {PANE3_SECTION.workPaneDescription}
            </p>
          </div>
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
            <NextActionsCard
              deal={deal}
              manufacturer={manufacturer}
              selectedDetail={selectedDetail}
              onOpenDetail={onOpenDetail}
              onRequestReplyFocus={setReplyFocusRequest}
            />
            <ChatInboxCard
              inbox={deal.chatInbox}
              onPaste={(content) => onPasteChat(content)}
              onApplySuggestion={onApplySuggestion}
              onApplyAll={onApplyAllSuggestions}
              externalAnalysis={externalInboxAnalysis}
              onConsumeExternalAnalysis={onConsumeExternalAnalysis}
            />
            <ReplyAssistCard
              deal={deal}
              manufacturer={manufacturer}
              focusRequest={replyFocusRequest}
              onFocusRequestConsumed={() => setReplyFocusRequest(null)}
            />
          </div>
        </div>

        {/* 進捗・記録 */}
        <div className="flex min-w-0 flex-col xl:min-h-0 xl:min-w-0 xl:flex-1 xl:overflow-hidden">
          <div className="shrink-0 border-b border-border px-4 py-2 sm:px-6">
            <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
              {PANE3_SECTION.recordPane}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {PANE3_SECTION.recordPaneDescription}
            </p>
          </div>
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
            <NegotiationChecklistCard
              deal={deal}
              manufacturer={manufacturer}
              selectedDetail={selectedDetail}
              onOpenDetail={onOpenDetail}
            />
            <ConfirmedTermsCard deal={deal} />
            <DealAttachmentsCard
              attachments={deal.attachments}
              onAddFiles={onAddAttachments}
              onAnalyzeAttachment={onAnalyzeAttachment}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Pane 4 互換のスタブ export
export function AxisScoreRow() {
  return null;
}
