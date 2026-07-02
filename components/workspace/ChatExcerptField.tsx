"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  localizeExcerptWithStatus,
  needsJapaneseTranslation,
} from "@/lib/excerpt-localize";
import { Button } from "@/components/ui/button";
import { InlineTextareaField } from "@/components/primitives";

export function ChatExcerptField({
  value,
  onSave,
}: {
  value: string;
  onSave: (chatExcerpt: string) => void;
}) {
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(new Set<string>());

  const runTranslate = useCallback(
    async (raw: string, { auto }: { auto: boolean }) => {
      if (!raw || !needsJapaneseTranslation(raw)) return;

      if (auto && attemptedRef.current.has(raw)) return;
      if (auto) attemptedRef.current.add(raw);

      setTranslating(true);
      setError(null);

      try {
        const result = await localizeExcerptWithStatus(raw);
        if (result.error) {
          setError(result.error);
          attemptedRef.current.delete(raw);
          return;
        }
        if (result.text && result.text !== raw) {
          onSave(result.text);
        }
      } finally {
        setTranslating(false);
      }
    },
    [onSave],
  );

  useEffect(() => {
    const raw = value.trim();
    void runTranslate(raw, { auto: true });
  }, [value, runTranslate]);

  const translateNow = () => {
    void runTranslate(value.trim(), { auto: false });
  };

  return (
    <div className="flex flex-col gap-2">
      {translating ? (
        <p className="text-xs text-muted-foreground">日本語に翻訳中…</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive">
          {error}
          {error.includes("OPENAI_API_KEY") ? "（Vercel の環境変数を確認してください）" : ""}
        </p>
      ) : null}
      <InlineTextareaField
        value={value}
        onSave={onSave}
        ariaLabel="トーク抜粋（日本語）"
      />
      {needsJapaneseTranslation(value) ? (
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="self-start"
          disabled={translating}
          onClick={translateNow}
        >
          日本語に翻訳
        </Button>
      ) : null}
    </div>
  );
}
