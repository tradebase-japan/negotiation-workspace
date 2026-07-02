"use client";

import {
  DEAL_TOPIC_ORDER,
  MANUFACTURER_TOPIC_ORDER,
  TOPIC_STATUS_LABELS,
  getTopicLabel,
} from "@/lib/negotiation-topics";
import { cn } from "@/lib/utils";
import {
  type Deal,
  type Manufacturer,
  type SelectedDetail,
} from "@/lib/schema";
import { Badge } from "@/components/ui/badge";

const DONE_STATUSES = new Set([
  "agreed",
  "acknowledged",
  "zero_ok",
  "holder_ours",
  "holder_manufacturer",
  "holder_shared",
]);

type TableRow = {
  id: string;
  scope: "manufacturer" | "deal";
  topicId: string;
  label: string;
  status: string;
  statusLabel: string;
  isDone: boolean;
};

function buildRows(
  deal: Deal,
  manufacturer: Manufacturer,
): TableRow[] {
  const rows: TableRow[] = [];

  for (const topicId of MANUFACTURER_TOPIC_ORDER) {
    const status = manufacturer.topics[topicId]?.status ?? "not_started";
    rows.push({
      id: `mfr-${topicId}`,
      scope: "manufacturer",
      topicId,
      label: getTopicLabel("manufacturer", topicId),
      status,
      statusLabel: TOPIC_STATUS_LABELS[status] ?? status,
      isDone: DONE_STATUSES.has(status),
    });
  }

  for (const topicId of DEAL_TOPIC_ORDER) {
    const status = deal.topics[topicId]?.status ?? "not_started";
    rows.push({
      id: `deal-${topicId}`,
      scope: "deal",
      topicId,
      label: getTopicLabel("deal", topicId),
      status,
      statusLabel: TOPIC_STATUS_LABELS[status] ?? status,
      isDone: DONE_STATUSES.has(status),
    });
  }

  return rows;
}

function statusBadgeVariant(
  status: string,
  isDone: boolean,
): "default" | "secondary" | "outline" {
  if (isDone) return "default";
  if (status === "not_started") return "outline";
  return "secondary";
}

export function NegotiationTablePane({
  deal,
  manufacturer,
  selectedDetail,
  highlightTopicKeys,
  onOpenDetail,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  selectedDetail: SelectedDetail;
  highlightTopicKeys?: Set<string>;
  onOpenDetail: (next: SelectedDetail) => void;
}) {
  const rows = buildRows(deal, manufacturer);
  const doneCount = rows.filter((r) => r.isDone).length;

  return (
    <section className="flex min-h-0 min-w-[300px] flex-1 flex-col overflow-hidden border-r border-[#d4d4d0] bg-[#ececea]">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-[#ececea] px-3.5 py-3">
        <div>
          <h2 className="text-sm font-semibold">{deal.productName} 交渉表</h2>
          <p className="text-[11px] text-muted-foreground">進捗 · 合意状況</p>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {doneCount}/{rows.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[#f9fafb]">
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">項目</th>
              <th className="px-3 py-2 text-right font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = `${row.scope}:${row.topicId}`;
              const selected =
                selectedDetail?.type === "topic" &&
                selectedDetail.scope === row.scope &&
                selectedDetail.topicId === row.topicId;
              const highlighted = highlightTopicKeys?.has(key);

              return (
                <tr
                  key={row.id}
                  onClick={() =>
                    onOpenDetail({
                      type: "topic",
                      scope: row.scope,
                      topicId: row.topicId,
                    })
                  }
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors hover:bg-white/70",
                    selected && "bg-teal-50/90",
                    highlighted && !selected && "bg-amber-50/60",
                  )}
                >
                  <td className="px-3 py-2.5 font-medium">{row.label}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Badge
                      variant={statusBadgeVariant(row.status, row.isDone)}
                      size="xs"
                    >
                      {row.statusLabel}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
