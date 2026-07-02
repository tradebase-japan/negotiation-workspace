import { NextResponse } from "next/server";
import { z } from "zod";

import { isMostlyEnglish } from "@/lib/excerpt-localize";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().min(1).max(4000),
});

const responseSchema = z.object({
  translated: z.string(),
});

const SYSTEM_PROMPT = `You translate short excerpts from manufacturer negotiation chats (WeChat, LINE, email) into natural Japanese for a Japanese import agent reviewing the deal.

Rules:
- Output natural business Japanese that is easy to scan later.
- Keep numbers, MOQ, USD amounts, dates, URLs, brand names, and product codes as-is (you may add brief Japanese gloss in parentheses when helpful).
- Do not add commentary or negotiation advice — translation only.
- If the input is already mostly Japanese, return it unchanged.
- Output valid JSON only: { "translated": "..." }`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY が未設定です", code: "MISSING_API_KEY" },
      { status: 503 },
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  if (!isMostlyEnglish(body.text)) {
    return NextResponse.json({ translated: body.text.trim() });
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
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Translate to Japanese:\n\n${body.text}`,
            },
          ],
        }),
      },
    );

    if (!openaiResponse.ok) {
      console.error(
        "[translate-excerpt] OpenAI error:",
        openaiResponse.status,
        await openaiResponse.text(),
      );
      return NextResponse.json(
        { error: "翻訳に失敗しました", code: "OPENAI_ERROR" },
        { status: 502 },
      );
    }

    const completion = (await openaiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "翻訳結果が空でした", code: "EMPTY_RESPONSE" },
        { status: 502 },
      );
    }

    const parsed = responseSchema.parse(JSON.parse(raw));
    return NextResponse.json({ translated: parsed.translated.trim() });
  } catch (error) {
    console.error("[translate-excerpt]", error);
    return NextResponse.json(
      { error: "翻訳中にエラーが発生しました", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
