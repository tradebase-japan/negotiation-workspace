"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, MessageSquareText, Sparkles } from "lucide-react";

import { type Deal, type Manufacturer } from "@/lib/schema";
import {
  buildReplyAssistPayload,
  requestReplyDraft,
  type ReplyDraftFocus,
  type ReplyDraftResult,
} from "@/lib/reply-assist";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const FOCUS_OPTIONS: { value: ReplyDraftFocus; label: string }[] = [
  { value: "general", label: "全体（優先事項をAIが判断）" },
  { value: "moq", label: "MOQ" },
  { value: "exclusivity", label: "独占性" },
  { value: "certification", label: "認証・PSE" },
  { value: "price", label: "価格" },
  { value: "schedule", label: "スケジュール" },
  { value: "business_model", label: "ビジネスモデル説明" },
  { value: "crowdfunding", label: "クラファン説明" },
];

const REFINE_PRESETS = [
  { label: "もっと柔らかく", value: "もっと柔らかく、押し付けがましくないトーンにしてください" },
  { label: "もっと短く", value: "要点だけの短い返信にしてください" },
  { label: "具体条件を強調", value: "数字や条件をはっきり書いてください" },
] as const;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <>
          <Check className="size-3" aria-hidden />
          コピー済み
        </>
      ) : (
        <>
          <Copy className="size-3" aria-hidden />
          {label}
        </>
      )}
    </Button>
  );
}

export function ReplyAssistCard({
  deal,
  manufacturer,
  focusRequest,
  onFocusRequestConsumed,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  focusRequest?: ReplyDraftFocus | null;
  onFocusRequestConsumed?: () => void;
}) {
  const [userIntent, setUserIntent] = useState("");
  const [focusTopic, setFocusTopic] = useState<ReplyDraftFocus>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReplyDraftResult | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    setFocusTopic(focusRequest);
    requestAnimationFrame(() => {
      document
        .getElementById("pane3-reply-assist")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    onFocusRequestConsumed?.();
  }, [focusRequest, onFocusRequestConsumed]);

  const hasContext =
    deal.chatInbox.length > 0 ||
    Object.values(deal.topics).some((t) => t.chatExcerpt?.trim()) ||
    userIntent.trim().length > 0;

  const generate = async (refinement?: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = buildReplyAssistPayload(deal, manufacturer, {
        userIntent,
        focusTopic,
        refinement,
        previousDraft: refinement ? result?.draftEnglish : undefined,
      });
      const draft = await requestReplyDraft(payload);
      setResult(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "返信案の生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card id="pane3-reply-assist">
      <CardHeader>
        <CardTitle emphasis="prominent">
          {PANE3_SECTION.replyAssist}
        </CardTitle>
        <CardDescription>{PANE3_SECTION.replyAssistDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Textarea
            value={userIntent}
            onChange={(e) => setUserIntent(e.target.value)}
            placeholder="例: サンプル到着のお礼を伝えつつ、MOQ1000のロゴ印刷条件で進めたい。独占は一旦保留で。"
            rows={3}
            className="min-h-[88px] resize-y bg-card text-sm"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={focusTopic}
              onValueChange={(value) => setFocusTopic(value as ReplyDraftFocus)}
            >
              <SelectTrigger size="sm" className="w-[220px]">
                <SelectValue placeholder="フォーカス" />
              </SelectTrigger>
              <SelectContent>
                {FOCUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              onClick={() => void generate()}
              disabled={loading || !hasContext}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              返信案を生成
            </Button>
          </div>

          {!hasContext && (
            <p className="text-xs text-muted-foreground">
              トーク受信箱に履歴を貼るか、上の「今回伝えたいこと」を入力してください。
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
              {error.includes("OPENAI_API_KEY") && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <code className="rounded bg-muted px-1">.env.local</code>{" "}
                  に{" "}
                  <code className="rounded bg-muted px-1">
                    OPENAI_API_KEY=sk-...
                  </code>{" "}
                  を設定し、dev サーバーを再起動してください。
                </p>
              )}
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <MessageSquareText className="size-4 text-primary" aria-hidden />
                  <span className="text-sm font-medium">返信方針</span>
                </div>
                <p className="text-sm text-foreground">{result.strategyNotes}</p>
                {result.draftJapaneseSummary && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    要点: {result.draftJapaneseSummary}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">英語ドラフト</span>
                  <CopyButton text={result.draftEnglish} label="英語をコピー" />
                </div>
                <div className="rounded-md border border-border bg-card px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {result.draftEnglish}
                </div>
              </div>

              {result.cautions.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    送る前に確認
                  </p>
                  <ul className="flex flex-col gap-1">
                    {result.cautions.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-foreground"
                      >
                        <Badge variant="outline" size="xs" className="mt-0.5 shrink-0">
                          注意
                        </Badge>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {REFINE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="secondary"
                    size="xs"
                    disabled={loading}
                    onClick={() => void generate(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
