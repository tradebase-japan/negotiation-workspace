import { NextResponse } from "next/server";
import { z } from "zod";

import { type ReplyDraftResult } from "@/lib/reply-assist";

export const runtime = "nodejs";

const requestSchema = z.object({
  manufacturerName: z.string(),
  productName: z.string(),
  contactPerson: z.string().optional(),
  channel: z.string(),
  userIntent: z.string().default(""),
  focusTopic: z.string().default("general"),
  checklistSummary: z.string(),
  confirmedTerms: z.string(),
  chatHistory: z.string(),
  refinement: z.string().optional(),
  previousDraft: z.string().optional(),
});

const responseSchema = z.object({
  strategyNotes: z.string(),
  draftEnglish: z.string(),
  draftJapaneseSummary: z.string(),
  cautions: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are a negotiation assistant for a Japanese import agent who sells overseas manufacturer products in Japan via crowdfunding (Makuake), e-commerce, and retail.

Your job:
1. Read the negotiation context (checklist, confirmed terms, chat history).
2. Propose a professional, relationship-preserving reply in English to the manufacturer contact.
3. Explain your strategy in Japanese for the user.

Rules:
- Do NOT invent prices, MOQ, dates, or commitments not supported by the context.
- If information is missing, say so in cautions and phrase the draft as a question or soft follow-up.
- Match the manufacturer's language level (clear business English, not overly casual).
- Prefer one clear ask per email; avoid overwhelming the reader.
- When the user gives intent in Japanese, reflect it accurately in the English draft.
- Output valid JSON only.`;

function buildUserPrompt(body: z.infer<typeof requestSchema>): string {
  const focusLabel =
    body.focusTopic === "general"
      ? "全体（最も優先すべき未決事項）"
      : body.focusTopic;

  const parts = [
    `メーカー: ${body.manufacturerName}`,
    `商品: ${body.productName}`,
    body.contactPerson ? `担当: ${body.contactPerson}` : null,
    `連絡手段: ${body.channel}`,
    `フォーカス: ${focusLabel}`,
    "",
    "【チェックリスト】",
    body.checklistSummary,
    "",
    "【確定条件（要確認含む）】",
    body.confirmedTerms,
    "",
    "【トーク履歴】",
    body.chatHistory || "（履歴なし — トーク受信箱への貼り付けを推奨）",
  ].filter((line) => line !== null);

  if (body.userIntent) {
    parts.push("", "【ユーザーが今回伝えたいこと】", body.userIntent);
  }

  if (body.previousDraft && body.refinement) {
    parts.push(
      "",
      "【前回の下書き】",
      body.previousDraft,
      "",
      "【修正指示】",
      body.refinement,
    );
  }

  parts.push(
    "",
    "Return JSON:",
    `{ "strategyNotes": "日本語で2-4文。なぜこの返信方針か", "draftEnglish": "メーカーへの英語返信全文", "draftJapaneseSummary": "返信の要点を日本語1-2文", "cautions": ["送る前に確認すべき点"] }`,
  );

  return parts.join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY が未設定です。プロジェクト直下に .env.local を作成してください。",
        code: "MISSING_API_KEY",
      },
      { status: 503 },
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    const json = await request.json();
    body = requestSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  if (!body.chatHistory.trim() && !body.userIntent.trim()) {
    return NextResponse.json(
      {
        error:
          "トーク履歴または「今回伝えたいこと」のどちらかを入力してください",
        code: "EMPTY_CONTEXT",
      },
      { status: 400 },
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(body) },
          ],
        }),
      },
    );

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("[reply-draft] OpenAI error:", openaiResponse.status, errText);
      return NextResponse.json(
        { error: "OpenAI API の呼び出しに失敗しました", code: "OPENAI_ERROR" },
        { status: 502 },
      );
    }

    const completion = (await openaiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "AI からの応答が空でした", code: "EMPTY_RESPONSE" },
        { status: 502 },
      );
    }

    const parsed = responseSchema.parse(JSON.parse(raw)) satisfies ReplyDraftResult;
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[reply-draft]", error);
    return NextResponse.json(
      { error: "返信案の生成中にエラーが発生しました", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
