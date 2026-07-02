/**
 * トーク抜粋を Pane4 確認用に日本語化する。
 */

export function isMostlyEnglish(text: string): boolean {
  const stripped = text.replace(/\s/g, "");
  if (stripped.length < 8) return false;

  const latin = (stripped.match(/[A-Za-z]/g) ?? []).length;
  const cjk = (stripped.match(/[\u3040-\u9fff]/g) ?? []).length;

  if (cjk > latin) return false;
  return latin / stripped.length >= 0.35;
}

export async function localizeExcerptForDisplay(excerpt: string): Promise<string> {
  const trimmed = excerpt.trim();
  if (!trimmed || !isMostlyEnglish(trimmed)) return trimmed;

  try {
    const response = await fetch("/api/translate-excerpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    if (!response.ok) return trimmed;

    const json = (await response.json()) as { translated?: string };
    return json.translated?.trim() || trimmed;
  } catch {
    return trimmed;
  }
}

export async function localizeExcerptsForDisplay(
  excerpts: string[],
): Promise<string[]> {
  return Promise.all(excerpts.map((excerpt) => localizeExcerptForDisplay(excerpt)));
}
