"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { type ChatInboxEntry } from "@/lib/schema";
import {
  analyzeChatText,
  type ChatAnalysisResult,
  type ChatSuggestion,
} from "@/lib/chat-analyzer";
import { type NextActionItem } from "@/lib/next-actions";
import { PANE3_SECTION } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { type ReplyDraftFocus } from "@/lib/reply-assist";

type PasteResult = ChatAnalysisResult & { entryId: string | null };

export function ChatInboxCard({
  inbox,
  onPaste,
  onApplySuggestion,
  onApplyAll,
  externalAnalysis,
  onConsumeExternalAnalysis,
  pendingActions = [],
  highlightTopicKeys,
  onOpenAction,
  onRequestReplyFocus,
}: {
  inbox: ChatInboxEntry[];
  onPaste: (content: string) => PasteResult;
  onApplySuggestion: (suggestion: ChatSuggestion, inboxEntryId: string) => void;
  onApplyAll: (suggestions: ChatSuggestion[], inboxEntryId: string) => void;
  externalAnalysis?: PasteResult | null;
  onConsumeExternalAnalysis?: () => void;
  pendingActions?: NextActionItem[];
  highlightTopicKeys?: Set<string>;
  onOpenAction?: (scope: "manufacturer" | "deal", topicId: string) => void;
  onRequestReplyFocus?: (focus: ReplyDraftFocus) => void;
}) {
  const [draft, setDraft] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ChatAnalysisResult | null>(null);
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!externalAnalysis) return;
    const { entryId, ...result } = externalAnalysis;
    setLastResult(result);
    setLastEntryId(entryId);
    onConsumeExternalAnalysis?.();
  }, [externalAnalysis, onConsumeExternalAnalysis]);

  const handleAnalyze = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setAnalyzing(true);
    const { entryId, ...result } = onPaste(trimmed);
    setLastResult(result);
    setLastEntryId(entryId);
    setDraft("");
    setAnalyzing(false);
  };

  const previewAnalyze = () => {
    if (!draft.trim()) return;
    setLastResult(analyzeChatText(draft));
    setLastEntryId(null);
  };

  const showPending =
    pendingActions.length > 0 || (lastResult && lastResult.suggestions.length > 0);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle emphasis="prominent">{PANE3_SECTION.chatInbox}</CardTitle>
        <CardDescription>{PANE3_SECTION.chatInboxDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="メール・WeChat・LINEのやり取りをここに貼り付け…"
            rows={5}
            className="min-h-[100px] resize-y bg-card text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#1a4547] hover:bg-[#245558]"
              onClick={handleAnalyze}
              disabled={!draft.trim() || analyzing}
            >
              {analyzing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              貼り付けて解析
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={previewAnalyze}
              disabled={!draft.trim()}
            >
              解析プレビュー
            </Button>
          </div>

          {lastResult && (
            <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3">
              <p className="mb-2 text-sm text-foreground">{lastResult.overview}</p>
              {lastResult.suggestions.length > 0 && lastEntryId && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onApplyAll(lastResult.suggestions, lastEntryId)
                  }
                >
                  すべて要確認として反映
                </Button>
              )}
            </div>
          )}

          {showPending && (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-3 py-2">
                <p className="text-xs font-semibold text-foreground">
                  拾った未決事項
                </p>
                <p className="text-[11px] text-muted-foreground">
                  反映または返信案へ
                </p>
              </div>
              <ul className="divide-y divide-border">
                {(lastResult?.suggestions.length
                  ? lastResult.suggestions.map((s) => ({
                      id: s.id,
                      label: s.summary,
                      statusLabel: "要確認",
                      scope: s.scope,
                      topicId: s.topicId,
                      replyFocus: undefined as ReplyDraftFocus | undefined,
                      fromAnalysis: true,
                      suggestion: s,
                    }))
                  : pendingActions.map((a) => ({
                      id: a.id,
                      label: a.label,
                      statusLabel: a.statusLabel,
                      scope: a.scope,
                      topicId: a.topicId,
                      replyFocus: a.replyFocus,
                      fromAnalysis: false,
                      suggestion: null as ChatSuggestion | null,
                    }))
                ).map((item) => {
                  const key =
                    item.scope && item.topicId
                      ? `${item.scope}:${item.topicId}`
                      : item.id;
                  const highlighted = highlightTopicKeys?.has(key);

                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm",
                        highlighted && "border-l-2 border-l-[#1a4547] bg-teal-50/40",
                      )}
                    >
                      <span className="min-w-0 flex-1 font-medium">
                        {item.label}
                      </span>
                      {item.statusLabel && (
                        <Badge variant="secondary" size="xs">
                          {item.statusLabel}
                        </Badge>
                      )}
                      {item.fromAnalysis &&
                        item.suggestion &&
                        lastEntryId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              onApplySuggestion(item.suggestion!, lastEntryId)
                            }
                          >
                            反映
                          </Button>
                        )}
                      {item.scope && item.topicId && onOpenAction && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            onOpenAction(item.scope!, item.topicId!)
                          }
                        >
                          詳細
                        </Button>
                      )}
                      {onRequestReplyFocus && (
                        <Button
                          type="button"
                          size="xs"
                          className="bg-[#1a4547] hover:bg-[#245558]"
                          onClick={() => {
                            if (item.replyFocus) {
                              onRequestReplyFocus(item.replyFocus);
                            } else if (
                              item.scope === "deal" &&
                              item.topicId
                            ) {
                              onRequestReplyFocus(
                                item.topicId as ReplyDraftFocus,
                              );
                            } else {
                              onRequestReplyFocus("general");
                            }
                          }}
                        >
                          返信案
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {inbox.length > 0 && (
            <>
              <Separator />
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="text-left text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                貼り付け履歴（{inbox.length}件）{historyOpen ? " ▲" : " ▼"}
              </button>
              {historyOpen && (
                <ul className="flex flex-col gap-2">
                  {[...inbox].reverse().map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs"
                    >
                      <p className="mb-1 text-muted-foreground">
                        {entry.pastedAt}
                      </p>
                      <p className="line-clamp-3 whitespace-pre-wrap text-foreground">
                        {entry.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
