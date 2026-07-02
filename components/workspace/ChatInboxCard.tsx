"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { type ChatInboxEntry } from "@/lib/schema";
import {
  analyzeChatText,
  type ChatAnalysisResult,
  type ChatSuggestion,
} from "@/lib/chat-analyzer";
import { PANE3_SECTION } from "@/lib/labels";
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

type PasteResult = ChatAnalysisResult & { entryId: string | null };

export function ChatInboxCard({
  inbox,
  onPaste,
  onApplySuggestion,
  onApplyAll,
  externalAnalysis,
  onConsumeExternalAnalysis,
}: {
  inbox: ChatInboxEntry[];
  onPaste: (content: string) => PasteResult;
  onApplySuggestion: (suggestion: ChatSuggestion, inboxEntryId: string) => void;
  onApplyAll: (suggestions: ChatSuggestion[], inboxEntryId: string) => void;
  externalAnalysis?: PasteResult | null;
  onConsumeExternalAnalysis?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ChatAnalysisResult | null>(null);
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);

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

  return (
    <Card>
      <CardHeader>
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
            className="min-h-[120px] resize-y bg-card text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
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
              解析プレビュー（保存しない）
            </Button>
          </div>

          {lastResult && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
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
              <ul className="mt-3 flex flex-col gap-2">
                {lastResult.suggestions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{s.summary}</span>
                      <Badge variant="secondary" size="xs">
                        要確認
                      </Badge>
                    </div>
                    {s.memo && (
                      <p className="text-xs text-muted-foreground">{s.memo}</p>
                    )}
                    {s.excerpt && (
                      <p className="rounded border border-border bg-muted/30 px-2 py-1.5 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {s.excerpt}
                      </p>
                    )}
                    {lastEntryId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="self-start"
                        onClick={() => onApplySuggestion(s, lastEntryId)}
                      >
                        この内容を反映
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {inbox.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  貼り付け履歴（{inbox.length}件）
                </p>
                <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
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
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
