/**
 * 長いトーク履歴から、トピックごとに関連する抜粋を抽出する。
 */

export type ExcerptScope = "manufacturer" | "deal";

const MAX_EXCERPT_CHARS = 1_200;

const DEAL_TOPIC_KEYWORDS: Record<string, RegExp[]> = {
  exclusivity: [
    /exclusive/i,
    /独占/,
    /do not sell/i,
    /ブランド.*日本/i,
    /OEM/i,
    /ODM/i,
    /代理/,
  ],
  moq: [
    /MOQ/i,
    /minimum order/i,
    /最低発注/,
    /\d+\s*pieces?/i,
    /量産/,
    /ロゴ/,
  ],
  certification: [
    /PSE/i,
    /certification/i,
    /証明書/,
    /認証/,
    /software installation/i,
    /インストール/,
  ],
  price: [
    /USD\$?/i,
    /unit price/i,
    /価格/,
    /priced at/i,
    /サンプル.*\$/,
    /\$\d+/,
  ],
  schedule: [
    /DHL/i,
    /WAYBILL/i,
    /samples?.*ship/i,
    /発送/,
    /arrive/i,
    /到着/,
    /lead time/i,
    /Wise/i,
    /入金/,
    /納期/,
  ],
};

const MANUFACTURER_TOPIC_KEYWORDS: Record<string, RegExp[]> = {
  business_model: [/business model/i, /ビジネスモデル/, /partner/i, /代理店/],
  crowdfunding: [/makuake/i, /crowdfunding/i, /クラファン/, /クラウドファンディング/],
  four_step_channel: [
    /4ステップ/,
    /four.step/i,
    /楽天/,
    /amazon/i,
    /販売チャネル/,
  ],
  cost_coverage: [
    /22%/,
    /marketing/i,
    /マーケ/,
    /費用/,
    /shipping/i,
    /配送料/,
    /手数料/,
  ],
  pre_marketing: [/pre-marketing/i, /プレマーケ/, /LINE.*連絡/],
};

const SECTION_HINTS: Record<string, RegExp> = {
  exclusivity: /独占|exclusive|OEM|ブランド/i,
  moq: /MOQ|最低発注|量産/i,
  certification: /認証|PSE|証明書|software/i,
  price: /価格|price|USD|単価/i,
  schedule: /サンプル|DHL|発送|Wise|スケジュール|納期/i,
  business_model: /ビジネス|business|モデル/i,
  crowdfunding: /クラファン|makuake|crowdfunding/i,
  four_step_channel: /チャネル|4ステップ|販売/i,
  cost_coverage: /費用|コスト|22%|手数料/i,
  pre_marketing: /プレマーケ|pre-marketing/i,
};

export function stripInboxSourceLabel(text: string): string {
  return text.replace(/^\[(?:PDF|テキスト):[^\]]+\]\s*\n*/i, "").trim();
}

function excerptAround(text: string, index: number, radius = 220): string {
  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

export function splitChatBlocks(text: string): string[] {
  const cleaned = stripInboxSourceLabel(text);
  const parts = cleaned.split(
    /\n(?=(?:={3,}|-{3,}|\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}|\d{1,2}:\d{2}\s|ページ\s+\d+|---\s*[^\n]+))/,
  );
  const blocks = parts.map((p) => p.trim()).filter((p) => p.length > 15);
  if (blocks.length > 1) return blocks;

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);
  return paragraphs.length > 0 ? paragraphs : [cleaned];
}

function scoreBlock(block: string, keywords: RegExp[]): number {
  return keywords.reduce((sum, re) => sum + (re.test(block) ? 1 : 0), 0);
}

function findLabeledSection(text: string, topicId: string): string | null {
  const hint = SECTION_HINTS[topicId];
  if (!hint) return null;

  const sectionMatch = text.match(
    new RegExp(
      `---\\s*[^\\n]*${hint.source}[^\\n]*---\\s*([\\s\\S]*?)(?=\\n---|$)`,
      "i",
    ),
  );
  if (sectionMatch?.[1]?.trim()) {
    return sectionMatch[1].trim().slice(0, MAX_EXCERPT_CHARS);
  }
  return null;
}

export function extractTopicExcerpt(
  text: string,
  scope: ExcerptScope,
  topicId: string,
): string {
  const cleaned = stripInboxSourceLabel(text);
  if (!cleaned) return "";

  const labeled = findLabeledSection(cleaned, topicId);
  if (labeled) return labeled;

  const keywords =
    scope === "deal"
      ? (DEAL_TOPIC_KEYWORDS[topicId] ?? [])
      : (MANUFACTURER_TOPIC_KEYWORDS[topicId] ?? []);

  if (keywords.length === 0) return cleaned.slice(0, MAX_EXCERPT_CHARS);

  const blocks = splitChatBlocks(cleaned);
  let bestBlock = "";
  let bestScore = 0;

  for (const block of blocks) {
    const score = scoreBlock(block, keywords);
    if (score > bestScore) {
      bestScore = score;
      bestBlock = block;
    }
  }

  if (bestBlock && bestScore > 0) {
    return bestBlock.slice(0, MAX_EXCERPT_CHARS);
  }

  for (const re of keywords) {
    const match = cleaned.match(re);
    if (match?.index !== undefined) {
      return excerptAround(cleaned, match.index, 400);
    }
  }

  return "";
}

export function resolveSuggestionExcerpt(
  fullText: string,
  scope: ExcerptScope,
  topicId: string,
  suggestionExcerpt?: string,
): string {
  if (suggestionExcerpt?.trim()) return suggestionExcerpt.trim();
  const extracted = extractTopicExcerpt(fullText, scope, topicId);
  if (extracted) return extracted;
  return stripInboxSourceLabel(fullText).slice(0, 800);
}
