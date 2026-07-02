"use client";

import { cn } from "@/lib/utils";
import {
  buildDealSummary,
  type SummaryCell,
  type SummaryTone,
} from "@/lib/deal-summary";
import { type Deal, type Manufacturer, type SelectedDetail } from "@/lib/schema";

const toneValueClass: Record<SummaryTone, string> = {
  ok: "text-green-700",
  warn: "text-amber-700",
  bad: "text-red-700",
  muted: "text-muted-foreground",
};

type DealSummaryBarProps = {
  deal: Deal;
  manufacturer: Manufacturer;
  onOpenTopic: (detail: Extract<SelectedDetail, { type: "topic" }>) => void;
};

function SummaryCellButton({
  cell,
  onOpen,
}: {
  cell: SummaryCell;
  onOpen?: () => void;
}) {
  const clickable = Boolean(cell.topicScope && cell.topicId && onOpen);

  const content = (
    <>
      <span className="text-[10px] tracking-wide text-muted-foreground">
        {cell.label}
      </span>
      <span
        className={cn(
          "mt-0.5 text-lg leading-tight font-bold tabular-nums",
          toneValueClass[cell.tone],
          cell.id === "progress" && "text-base",
        )}
      >
        {cell.value}
      </span>
      <span className="mt-0.5 text-[10px] text-muted-foreground">{cell.sub}</span>
    </>
  );

  if (!clickable) {
    return (
      <div className="flex min-w-[110px] flex-col justify-center border-r border-border px-4 py-2">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-w-[110px] flex-col justify-center border-r border-border px-4 py-2 text-left transition-colors hover:bg-teal-50/80"
    >
      {content}
    </button>
  );
}

export function DealSummaryBar({
  deal,
  manufacturer,
  onOpenTopic,
}: DealSummaryBarProps) {
  const cells = buildDealSummary(deal, manufacturer);

  return (
    <div
      className="flex shrink-0 overflow-x-auto border-b-2 border-teal-200/80 bg-card shadow-sm"
      aria-label="重要条件サマリー"
    >
      <div className="flex shrink-0 items-center bg-[#1a4547] px-3.5 text-[10px] font-semibold tracking-wider text-white">
        重要条件
      </div>
      {cells.map((cell) => (
        <SummaryCellButton
          key={cell.id}
          cell={cell}
          onOpen={
            cell.topicScope && cell.topicId
              ? () =>
                  onOpenTopic({
                    type: "topic",
                    scope: cell.topicScope!,
                    topicId: cell.topicId!,
                  })
              : undefined
          }
        />
      ))}
    </div>
  );
}
