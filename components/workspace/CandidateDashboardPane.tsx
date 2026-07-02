"use client";

import { useMemo } from "react";

import {
  type Deal,
  type Manufacturer,
  type SelectedDetail,
} from "@/lib/schema";
import { NegotiationTablePane } from "@/components/workspace/NegotiationTablePane";
import { WorkbenchPane } from "@/components/workspace/WorkbenchPane";
import type { ChatAnalysisResult, ChatSuggestion } from "@/lib/chat-analyzer";

export function CandidateDashboardPane({
  deal,
  manufacturer,
  manufacturerName,
  selectedDetail,
  onOpenDetail,
  onPasteChat,
  onApplySuggestion,
  onApplyAllSuggestions,
  onAddAttachments,
  onAnalyzeAttachment,
  externalInboxAnalysis,
  onConsumeExternalAnalysis,
  highlightTopicKeys,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  manufacturerName: string;
  selectedDetail: SelectedDetail;
  onOpenDetail: (next: SelectedDetail, anchor?: string) => void;
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
  highlightTopicKeys?: Set<string>;
}) {
  const highlight = useMemo(
    () => highlightTopicKeys ?? new Set<string>(),
    [highlightTopicKeys],
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <WorkbenchPane
        deal={deal}
        manufacturer={manufacturer}
        manufacturerName={manufacturerName}
        selectedDetail={selectedDetail}
        onOpenDetail={onOpenDetail}
        onPasteChat={onPasteChat}
        onApplySuggestion={onApplySuggestion}
        onApplyAllSuggestions={onApplyAllSuggestions}
        onAddAttachments={onAddAttachments}
        onAnalyzeAttachment={onAnalyzeAttachment}
        externalInboxAnalysis={externalInboxAnalysis}
        onConsumeExternalAnalysis={onConsumeExternalAnalysis}
        highlightTopicKeys={highlight}
      />
      <NegotiationTablePane
        deal={deal}
        manufacturer={manufacturer}
        selectedDetail={selectedDetail}
        highlightTopicKeys={highlight}
        onOpenDetail={(next) => onOpenDetail(next)}
      />
    </div>
  );
}

export function AxisScoreRow() {
  return null;
}
