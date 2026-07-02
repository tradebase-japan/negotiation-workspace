/**
 * ブラウザ上で PDF からテキストを抽出（トーク履歴 PDF の解析用）。
 * クライアントコンポーネントからのみ呼び出すこと。
 */

export async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }

  return parts.join("\n\n").replace(/\s+/g, " ").trim();
}

export function looksLikeChatHistory(text: string): boolean {
  if (text.length < 80) return false;
  const signals = [
    /hi\s+hiroki|dear\s+hiroki|best regards|よろしく|ありがとう/i,
    /moq|exclusive|usd\$|dhl|wechat|makuake/i,
    /发件人|送信|subject:|re:/i,
    /@/,
  ];
  return signals.filter((re) => re.test(text)).length >= 2;
}
