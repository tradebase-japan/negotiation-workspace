"use client";

import { useState } from "react";
import { Download, FileText, ImageIcon, Sparkles } from "lucide-react";

import { canAnalyzeAsChatHistory } from "@/lib/attachment-text";
import { type Attachment } from "@/lib/schema";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AttachmentPreviewDialog } from "@/components/workspace/AttachmentPreviewDialog";

export function AttachmentList({
  items,
  onAnalyzeAttachment,
}: {
  items: Attachment[];
  onAnalyzeAttachment?: (attachmentId: string) => void;
}) {
  const [openItem, setOpenItem] = useState<Attachment | null>(null);

  if (items.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-muted-foreground">
        添付はまだありません。上の「アップロード」から追加できます。
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {items.map((file) => {
          const isTxt = file.kind === "txt";
          const isImage = file.kind === "image";
          const isPdf = file.kind === "pdf";
          const canPreview = isTxt || isImage;
          const analyzable = canAnalyzeAsChatHistory(file);
          const Icon = isImage ? ImageIcon : FileText;
          return (
            <li
              key={file.id}
              className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => {
                    if (canPreview) setOpenItem(file);
                  }}
                  disabled={!canPreview}
                  aria-label={
                    canPreview
                      ? `${file.name} のプレビューを開く`
                      : `${file.name}`
                  }
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">
                    {file.name}
                  </span>
                  {isPdf && (
                    <span className="ml-1 shrink-0 rounded border border-border px-1 text-[10px] text-muted-foreground">
                      {analyzable ? "文字読取済" : "PDF"}
                    </span>
                  )}
                  {isTxt && analyzable && (
                    <span className="ml-1 shrink-0 rounded border border-border px-1 text-[10px] text-muted-foreground">
                      テキスト
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                    {file.size}
                  </span>
                </button>

                <Separator orientation="vertical" aria-hidden />

                <button
                  type="button"
                  onClick={() => {
                    if (file.kind === "image" && file.dataUrl) {
                      const a = document.createElement("a");
                      a.href = file.dataUrl;
                      a.download = file.name;
                      a.click();
                    } else {
                      console.info("[stub] download:", file.id);
                    }
                  }}
                  aria-label={`${file.name} をダウンロード`}
                  className="flex shrink-0 items-center px-2.5 transition outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Download className="size-3.5 text-muted-foreground" />
                </button>
              </div>
              {(isPdf || isTxt) && onAnalyzeAttachment && (
                <div className="border-t border-border px-3 py-2">
                  {analyzable ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => onAnalyzeAttachment(file.id)}
                    >
                      <Sparkles className="size-3" aria-hidden />
                      トーク履歴として解析
                    </Button>
                  ) : isPdf ? (
                    <p className="text-[11px] text-muted-foreground">
                      文字を読み取れませんでした。テキスト付きPDFか、再アップロードをお試しください。
                    </p>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <AttachmentPreviewDialog
        item={openItem}
        onOpenChange={(open) => {
          if (!open) setOpenItem(null);
        }}
      />
    </>
  );
}
