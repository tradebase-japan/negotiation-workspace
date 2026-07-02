/**
 * トーク受信箱に貼ったテキストから、交渉トピック・確定値の候補を抽出する。
 * OPENAI_API_KEY があれば API ルート経由でも利用可能（本モジュールはルールベースのフォールバック）。
 */

import type { DealTopicKey, ManufacturerTopicKey } from "@/lib/negotiation-topics";
import { extractTopicExcerpt } from "@/lib/chat-excerpt";

export type SuggestionScope = "manufacturer" | "deal";

export type ChatSuggestion = {
  id: string;
  scope: SuggestionScope;
  topicId: string;
  status?: string;
  termField?: "moq" | "exclusivity" | "certification";
  termValue?: string;
  memo?: string;
  excerpt?: string;
  summary: string;
};

export type ChatAnalysisResult = {
  suggestions: ChatSuggestion[];
  overview: string;
};

function excerptAround(text: string, index: number, len = 120): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + len);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function pushUnique(
  list: ChatSuggestion[],
  item: Omit<ChatSuggestion, "id">,
): void {
  const key = `${item.scope}:${item.topicId}:${item.termField ?? ""}:${item.status ?? ""}`;
  if (
    list.some(
      (s) =>
        `${s.scope}:${s.topicId}:${s.termField ?? ""}:${s.status ?? ""}` === key,
    )
  ) {
    return;
  }
  list.push({ ...item, id: `sug-${list.length}-${Date.now()}` });
}

export function analyzeChatText(content: string): ChatAnalysisResult {
  const text = content.trim();
  if (!text) {
    return { suggestions: [], overview: "テキストが空です。" };
  }

  const lower = text.toLowerCase();
  const suggestions: ChatSuggestion[] = [];

  // --- 独占 ---
  if (
    /do not sell products under the brand xfanic|xfanic.*brand.*japan/i.test(
      text,
    ) ||
    /ブランド.*日本.*販売.*不可|独占.*拒否/i.test(text)
  ) {
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "exclusivity",
      status: "rejected_oem_only",
      termField: "exclusivity",
      termValue: "Xfanicブランドでの日本販売不可。OEM/自社ブランド路線",
      memo: "メーカーは自社ブランドでの日本販売を認めていない",
      excerpt: excerptAround(
        text,
        lower.indexOf("do not sell") >= 0
          ? lower.indexOf("do not sell")
          : 0,
      ),
      summary: "独占: Xfanicブランドでの日本販売は不可（OEMのみ）",
    });
  }

  if (
    /exclusive sales rights|独占|exclusive.*japan|一定期間の独占/i.test(text)
  ) {
    const moq5000 = /5000\s*pieces?|5000\s*個|moq.*5000/i.test(text);
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "exclusivity",
      status: moq5000 ? "negotiating" : "explained",
      termField: "exclusivity",
      termValue: moq5000
        ? "6ヶ月独占の条件として MOQ 5000・$52・30%前払いが提示"
        : "独占条件について言及あり",
      memo: "独占の条件を確認してください",
      summary: moq5000
        ? "独占: MOQ5000・$52・30%前払いの条件で提示"
        : "独占: 交渉・説明のやり取りあり",
    });
  }

  if (/agreed|合意|well noted|よろしいでしょうか.*ありがとう/i.test(text)) {
    if (/exclusive|独占/i.test(text)) {
      pushUnique(suggestions, {
        scope: "deal",
        topicId: "exclusivity",
        status: "agreed",
        termField: "exclusivity",
        termValue: "独占条件に合意の兆候",
        summary: "独占: 合意または前向きな返答あり",
      });
    }
  }

  // --- MOQ ---
  const moqMatches = [
    ...text.matchAll(
      /MOQ\s*(\d+[Kk]?)\s*[:：]?\s*USD?\$?\s*([\d.]+)/gi,
    ),
    ...text.matchAll(
      /minimum order quantity is (\d[\d,]*)\s*pieces?/gi,
    ),
    ...text.matchAll(/MOQ\s+for\s+OEM.*?(\d+[Kk])/gi),
    ...text.matchAll(/(\d{3,5})\s*pieces?.*unit price\s*\$?([\d.]+)/gi),
  ];

  if (moqMatches.length > 0) {
    const parts = moqMatches
      .slice(0, 3)
      .map((m) => m[0].replace(/\s+/g, " ").trim())
      .join(" / ");
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "moq",
      status: "quantity_proposed",
      termField: "moq",
      termValue: parts,
      memo: "メーカーからMOQ・単価の提示あり",
      summary: `MOQ: ${parts}`,
    });
  }

  if (/no moq|moq.*zero|最小注文数なし|no minimum order/i.test(text)) {
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "moq",
      status: "negotiating",
      termField: "moq",
      termValue: "クラファン段階のMOQゼロを要請中",
      summary: "MOQ: ゼロMOQの交渉・要請あり",
    });
  }

  if (/800pcs|500pcs|1000\s*pieces|1K,?:/i.test(text)) {
    const tiers =
      text.match(
        /1\.?\s*MOQ[^\n]+|2\.?\s*MOQ[^\n]+|3\.?\s*MOQ[^\n]+/gi,
      ) ?? [];
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "moq",
      status: "quantity_proposed",
      termField: "moq",
      termValue:
        tiers.length > 0
          ? tiers.join(" | ")
          : "500/800/1000など複数ティアの提示あり",
      summary: "MOQ: 複数数量ティアが提示されています",
    });
  }

  // --- 価格 ---
  if (/USD\$?\s*[\d.]+|unit price|サンプル.*\$?\s*60|priced at USD/i.test(text)) {
    const prices = [...text.matchAll(/USD\$?\s*([\d.]+)/gi)]
      .map((m) => `$${m[1]}`)
      .slice(0, 5)
      .join(", ");
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "price",
      status: "negotiating",
      memo: prices ? `価格帯: ${prices}` : "価格に関する言及",
      summary: prices ? `価格: ${prices} など` : "価格: 交渉中の言及あり",
    });
  }

  // --- スケジュール ---
  if (/DHL|WAYBILL|samples?.*ship|発送|arrive by|到着/i.test(text)) {
    const waybill = text.match(/WAYBILL\s*[\d\s]+/i)?.[0];
    const date = text.match(
      /(?:by|until|expected).*?(July \d|7\/\d|\d{4}-\d{2}-\d{2})/i,
    )?.[0];
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "schedule",
      status: "agreed",
      termField: undefined,
      memo: [waybill, date].filter(Boolean).join(" / "),
      summary: `スケジュール: サンプル発送・到着${date ? ` (${date})` : ""}`,
    });
  }

  if (/wise|bank transfer|入金|payment.*receive/i.test(text)) {
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "schedule",
      status: "negotiating",
      memo: "送金・入金に関するやり取り",
      summary: "スケジュール: 支払い・入金の進捗あり",
    });
  }

  if (/lead time|Around \d+Days|納期/i.test(text)) {
    const lt = text.match(/Around\s+(\d+)\s*Days/i)?.[0];
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "schedule",
      status: "explained",
      memo: lt ?? "リードタイムの言及",
      summary: lt ? `スケジュール: 生産リードタイム ${lt}` : "スケジュール: 納期の言及",
    });
  }

  // --- 認証 ---
  if (/PSE|software installation|証明書|certification|CE |FCC/i.test(text)) {
    pushUnique(suggestions, {
      scope: "deal",
      topicId: "certification",
      status: "checking",
      termField: "certification",
      termValue: /software/i.test(text)
        ? "ソフトウェアパッケージ送付。PSE等は要確認"
        : "認証・証明書について言及あり",
      summary: "認証: 証明書・ソフト関連のやり取りあり",
    });
  }

  // --- クラファン・説明系 ---
  if (/makuake|crowdfunding|クラウドファンディング|クラファン/i.test(text)) {
    pushUnique(suggestions, {
      scope: "manufacturer",
      topicId: "crowdfunding",
      status: "explained",
      summary: "クラファン: 仕組み・Makuakeの説明あり",
    });
  }

  if (/22%|marketing.*cost|プレマーケ|pre-marketing/i.test(text)) {
    pushUnique(suggestions, {
      scope: "manufacturer",
      topicId: "cost_coverage",
      status: "explained",
      summary: "費用負担: マーケ費・手数料の説明あり",
    });
  }

  const overview =
    suggestions.length > 0
      ? `${suggestions.length} 件の候補を検出しました。内容を確認して「反映」を押してください。`
      : "自動では拾えませんでした。重要な文を選んでトピック別に貼るか、もう少し長い文脈を含めてください。";

  for (const suggestion of suggestions) {
    if (!suggestion.excerpt?.trim()) {
      const extracted = extractTopicExcerpt(
        text,
        suggestion.scope,
        suggestion.topicId,
      );
      if (extracted) suggestion.excerpt = extracted;
    }
  }

  return { suggestions, overview };
}

export function isDealTopicKey(id: string): id is DealTopicKey {
  return ["exclusivity", "moq", "certification", "price", "schedule"].includes(
    id,
  );
}

export function isManufacturerTopicKey(
  id: string,
): id is ManufacturerTopicKey {
  return [
    "business_model",
    "crowdfunding",
    "four_step_channel",
    "cost_coverage",
    "pre_marketing",
  ].includes(id);
}
