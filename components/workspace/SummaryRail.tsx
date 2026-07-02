"use client";

import { cn } from "@/lib/utils";
import { buildDealSummary, type SummaryTone } from "@/lib/deal-summary";
import { type Deal, type Manufacturer, type SelectedDetail } from "@/lib/schema";
import { Button } from "@/components/ui/button";

const chipToneClass: Record<SummaryTone, string> = {
  ok: "border-green-200 bg-green-50 text-green-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  bad: "border-red-200 bg-red-50 text-red-800",
  muted: "border-border bg-muted/40 text-muted-foreground",
};

type SummaryRailProps = {
  deal: Deal;
  manufacturer: Manufacturer;
  onOpenTopic: (detail: Extract<SelectedDetail, { type: "topic" }>) => void;
  onExpand: () => void;
};

export function SummaryRail({
  deal,
  manufacturer,
  onOpenTopic,
  onExpand,
}: SummaryRailProps) {
  const cells = buildDealSummary(deal, manufacturer).filter(
    (c) => c.id !== "progress",
  );

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-l border-border bg-card py-3">
      {cells.map((cell) => {
        const clickable = Boolean(cell.topicScope && cell.topicId);
        const short =
          cell.value.length > 6 ? cell.value.slice(0, 4) + "…" : cell.value;

        if (!clickable) {
          return (
            <div
              key={cell.id}
              className={cn(
                "w-11 rounded-md border px-1 py-2 text-center text-[9px] leading-tight",
                chipToneClass[cell.tone],
              )}
            >
              <strong className="block text-xs font-bold">{short}</strong>
              {cell.label.slice(0, 3)}
            </div>
          );
        }

        return (
          <button
            key={cell.id}
            type="button"
            onClick={() =>
              onOpenTopic({
                type: "topic",
                scope: cell.topicScope!,
                topicId: cell.topicId!,
              })
            }
            className={cn(
              "w-11 rounded-md border px-1 py-2 text-center text-[9px] leading-tight transition-opacity hover:opacity-80",
              chipToneClass[cell.tone],
            )}
          >
            <strong className="block text-xs font-bold">{short}</strong>
            {cell.label.slice(0, 3)}
          </button>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="mt-auto w-11 px-0 text-[9px]"
        onClick={onExpand}
      >
        開く
      </Button>
    </aside>
  );
}
