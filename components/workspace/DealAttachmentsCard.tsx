"use client";

import { useRef } from "react";
import { ImageIcon, Paperclip, Upload } from "lucide-react";

import { type Attachment } from "@/lib/schema";
import { PANE3_SECTION } from "@/lib/labels";
import { formatFileSize } from "@/lib/format";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttachmentList } from "@/components/workspace/AttachmentList";

export function DealAttachmentsCard({
  attachments,
  onAddFiles,
  onAnalyzeAttachment,
}: {
  attachments: Attachment[];
  onAddFiles: (files: FileList) => Promise<void>;
  onAnalyzeAttachment: (attachmentId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle emphasis="prominent">
              {PANE3_SECTION.attachments}
            </CardTitle>
            <CardDescription>
              {PANE3_SECTION.attachmentsDescription}
              。トーク履歴のPDF・テキストは自動で読み取り、解析できます。
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden />
            アップロード
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.txt"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) {
              void onAddFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Paperclip className="size-3.5" aria-hidden />
          PDF（トーク履歴可）・写真・テキスト
          <ImageIcon className="size-3.5" aria-hidden />
        </div>
        <AttachmentList
          items={attachments}
          onAnalyzeAttachment={onAnalyzeAttachment}
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          ※ ブラウザ内に保存されます。ページをリロードすると消える場合があります。
        </p>
      </CardContent>
    </Card>
  );
}

export async function filesToAttachments(files: FileList): Promise<Attachment[]> {
  const results: Attachment[] = [];
  for (const file of Array.from(files)) {
    const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const size = formatFileSize(file.size);
    if (file.type.startsWith("image/")) {
      const dataUrl = await readAsDataURL(file);
      results.push({
        id,
        kind: "image",
        name: file.name,
        size,
        dataUrl,
      });
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      let extractedText = "";
      try {
        extractedText = await extractTextFromPdf(file);
      } catch {
        extractedText = "";
      }
      results.push({
        id,
        kind: "pdf",
        name: file.name,
        size,
        extractedText,
      });
    } else {
      const previewText = await file.text().catch(() => "");
      results.push({
        id,
        kind: "txt",
        name: file.name,
        size,
        previewText,
      });
    }
  }
  return results;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
