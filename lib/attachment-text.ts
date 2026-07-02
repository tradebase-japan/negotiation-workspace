import { type Attachment } from "@/lib/schema";

export function getAttachmentTextContent(att: Attachment): string {
  if (att.kind === "pdf") return att.extractedText ?? "";
  if (att.kind === "txt") return att.previewText ?? "";
  return "";
}

export function canAnalyzeAsChatHistory(att: Attachment): boolean {
  if (att.kind !== "pdf" && att.kind !== "txt") return false;
  return getAttachmentTextContent(att).trim().length > 50;
}
