/**
 * トーク抜粋を Pane4 確認用に日本語化する。
 */

export function isMostlyEnglish(text: string): boolean {
  const stripped = text.replace(/\s/g, "");
  if (stripped.length < 8) return false;

  const latin = (stripped.match(/[A-Za-z]/g) ?? []).length;
  const cjk = (stripped.match(/[\u3040-\u9fff]/g) ?? []).length;

  if (cjk > latin) return false;
  return latin / stripped.length >= 0.25;
}

/** WeChat/LINE ログのように日時行＋英語本文が混ざる場合も拾う */
export function needsJapaneseTranslation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (isMostlyEnglish(trimmed)) return true;

  const latin = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  const cjk = (trimmed.match(/[\u3040-\u9fff]/g) ?? []).length;

  if (latin >= 40 && latin >= cjk) return true;

  const hasEnglishBlock = /[A-Za-z]{20,}/.test(trimmed);
  const hasEnglishWords =
    /\b(the|and|you|your|please|would|could|hello|hi|hope|share|sorry|price|retail|variant)\b/i.test(
      trimmed,
    );

  return hasEnglishBlock && hasEnglishWords;
}

export type LocalizeExcerptResult = {
  text: string;
  error?: string;
};

export async function localizeExcerptWithStatus(
  excerpt: string,
): Promise<LocalizeExcerptResult> {
  const trimmed = excerpt.trim();
  if (!trimmed || !needsJapaneseTranslation(trimmed)) {
    return { text: trimmed };
  }

  try {
    const response = await fetch("/api/translate-excerpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      translated?: string;
      error?: string;
    };

    if (!response.ok) {
      return {
        text: trimmed,
        error: json.error ?? "翻訳に失敗しました",
      };
    }

    return { text: json.translated?.trim() || trimmed };
  } catch {
    return { text: trimmed, error: "翻訳に失敗しました" };
  }
}

export async function localizeExcerptForDisplay(excerpt: string): Promise<string> {
  const result = await localizeExcerptWithStatus(excerpt);
  return result.text;
}

export async function localizeExcerptsForDisplay(
  excerpts: string[],
): Promise<string[]> {
  return Promise.all(excerpts.map((excerpt) => localizeExcerptForDisplay(excerpt)));
}
