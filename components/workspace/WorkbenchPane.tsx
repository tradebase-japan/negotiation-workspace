"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { type ReplyDraftFocus } from "@/lib/reply-assist";
import { computeAutoActions } from "@/lib/next-actions";
import {
  type Deal,
  type Manufacturer,
  type SelectedDetail,
} from "@/lib/schema";
import { PANE4_SECTION_IDS } from "@/lib/labels";
import { ChatInboxCard } from "@/components/workspace/ChatInboxCard";
import { ReplyAssistCard } from "@/components/workspace/ReplyAssistCard";
import { DealAttachmentsCard } from "@/components/workspace/DealAttachmentsCard";
import type { ChatAnalysisResult, ChatSuggestion } from "@/lib/chat-analyzer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function WorkbenchPane({
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
  ) => void | Promise<void>;
  onApplyAllSuggestions: (
    suggestions: ChatSuggestion[],
    inboxEntryId: string,
  ) => void | Promise<void>;
  onAddAttachments: (files: FileList) => Promise<void>;
  onAnalyzeAttachment: (attachmentId: string) => void;
  externalInboxAnalysis?: (ChatAnalysisResult & { entryId: string }) | null;
  onConsumeExternalAnalysis?: () => void;
  highlightTopicKeys?: Set<string>;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyFocusRequest, setReplyFocusRequest] =
    useState<ReplyDraftFocus | null>(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  const pendingActions = useMemo(
    () => computeAutoActions(deal, manufacturer).slice(0, 8),
    [deal, manufacturer],
  );

  const requestReply = (focus: ReplyDraftFocus) => {
    setReplyFocusRequest(focus);
    setReplyOpen(true);
  };

  return (
    <section className="flex min-h-0 min-w-[300px] flex-1 flex-col overflow-hidden border-r border-[#d4d4d0] bg-[#ececea]">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-[#ececea] px-3.5 py-3">
        <div>
          <h2 className="text-sm font-semibold">{manufacturerName} 作業台</h2>
          <p className="text-[11px] text-muted-foreground">
            {deal.productName} · トーク解析
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3">
        <div className="flex flex-col gap-3">
          <ChatInboxCard
            inbox={deal.chatInbox}
            onPaste={(content) => onPasteChat(content)}
            onApplySuggestion={onApplySuggestion}
            onApplyAll={onApplyAllSuggestions}
            externalAnalysis={externalInboxAnalysis}
            onConsumeExternalAnalysis={onConsumeExternalAnalysis}
            onRequestReplyFocus={requestReply}
            pendingActions={pendingActions}
            highlightTopicKeys={highlightTopicKeys}
            onOpenAction={(scope, topicId) =>
              onOpenDetail(
                { type: "topic", scope, topicId },
                PANE4_SECTION_IDS.template,
              )
            }
          />

          <Collapsible open={replyOpen} onOpenChange={setReplyOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm font-semibold shadow-sm">
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#1a4547]" aria-hidden />
                返信アシスト
              </span>
              <span className="text-xs text-muted-foreground">
                {replyOpen ? "閉じる" : "開く"}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ReplyAssistCard
                deal={deal}
                manufacturer={manufacturer}
                focusRequest={replyFocusRequest}
                onFocusRequestConsumed={() => setReplyFocusRequest(null)}
                embedded
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm font-semibold shadow-sm">
              <span>添付ファイル（{deal.attachments.length}件）</span>
              <span className="text-xs text-muted-foreground">
                {attachmentsOpen ? "閉じる" : "開く"}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <DealAttachmentsCard
                attachments={deal.attachments}
                onAddFiles={onAddAttachments}
                onAnalyzeAttachment={onAnalyzeAttachment}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  );
}
