"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ListTodo,
  Plus,
  Sparkles,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { type Deal, type Manufacturer, type SelectedDetail } from "@/lib/schema";
import { type ReplyDraftFocus } from "@/lib/reply-assist";
import { PANE3_SECTION, PANE4_SECTION_IDS } from "@/lib/labels";
import {
  buildNextActionsView,
  createPinnedAction,
  DEFAULT_VISIBLE_ACTIONS,
  loadPinnedActions,
  mergeVisibleActions,
  savePinnedActions,
  type NextActionItem,
  type PinnedAction,
} from "@/lib/next-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function ActionRow({
  item,
  selected,
  onOpen,
  onReply,
  onCompletePin,
}: {
  item: NextActionItem;
  selected: boolean;
  onOpen: () => void;
  onReply: () => void;
  onCompletePin?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-border bg-card px-2 py-2",
        selected && "border-primary/40 bg-accent/50",
      )}
    >
      {item.kind === "pin" && onCompletePin && (
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
          aria-label={`${item.label} を完了`}
          onChange={onCompletePin}
        />
      )}
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {item.label}
          </span>
          {item.statusLabel && (
            <Badge variant="outline" size="xs">
              {item.statusLabel}
            </Badge>
          )}
          {item.kind === "pin" && (
            <Badge variant="secondary" size="xs">
              手動
            </Badge>
          )}
        </div>
        {item.memo && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {item.memo}
          </p>
        )}
      </button>
      <Button
        type="button"
        variant="secondary"
        size="xs"
        className="shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onReply();
        }}
      >
        <Sparkles className="size-3" aria-hidden />
        返信案
      </Button>
    </div>
  );
}

export function NextActionsCard({
  deal,
  manufacturer,
  selectedDetail,
  onOpenDetail,
  onRequestReplyFocus,
}: {
  deal: Deal;
  manufacturer: Manufacturer;
  selectedDetail: SelectedDetail;
  onOpenDetail: (next: SelectedDetail, anchor?: string) => void;
  onRequestReplyFocus: (focus: ReplyDraftFocus) => void;
}) {
  const [pins, setPins] = useState<PinnedAction[]>([]);
  const [pinDraft, setPinDraft] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  useEffect(() => {
    setPins(loadPinnedActions(deal.id));
    setShowAll(false);
  }, [deal.id]);

  const persistPins = (next: PinnedAction[]) => {
    setPins(next);
    savePinnedActions(deal.id, next);
  };

  const view = useMemo(
    () => buildNextActionsView(deal, manufacturer, pins),
    [deal, manufacturer, pins],
  );

  const visible = mergeVisibleActions(view, showAll);
  const hiddenCount =
    view.activePins.length + view.autoActions.length - visible.length;

  const openAction = (item: NextActionItem) => {
    if (item.kind === "auto" && item.scope && item.topicId) {
      onOpenDetail(
        { type: "topic", scope: item.scope, topicId: item.topicId },
        PANE4_SECTION_IDS.template,
      );
      return;
    }
    onRequestReplyFocus(item.replyFocus);
  };

  const isSelected = (item: NextActionItem) =>
    item.kind === "auto" &&
    selectedDetail?.type === "topic" &&
    selectedDetail.scope === item.scope &&
    selectedDetail.topicId === item.topicId;

  const addPin = () => {
    const trimmed = pinDraft.trim();
    if (!trimmed) return;
    persistPins([...pins, createPinnedAction(trimmed)]);
    setPinDraft("");
  };

  const completePin = (pinId: string) => {
    persistPins(
      pins.map((p) => (p.id === pinId ? { ...p, completed: true } : p)),
    );
  };

  const restorePin = (pinId: string) => {
    persistPins(
      pins.map((p) => (p.id === pinId ? { ...p, completed: false } : p)),
    );
  };

  const totalCount = view.activePins.length + view.autoActions.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle emphasis="prominent" className="flex items-center gap-2">
          <ListTodo className="size-4 text-primary" aria-hidden />
          {PANE3_SECTION.nextActions}
        </CardTitle>
        <CardDescription>{PANE3_SECTION.nextActionsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="max-h-[min(20rem,calc(100svh-18rem))] overflow-y-auto overscroll-y-contain pr-1 sm:max-h-[min(24rem,calc(100svh-16rem))]">
            {totalCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                未決の交渉項目はありません。下から手動タスクを追加できます。
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((item) => (
                  <li key={item.id}>
                    <ActionRow
                      item={item}
                      selected={isSelected(item)}
                      onOpen={() => openAction(item)}
                      onReply={() => onRequestReplyFocus(item.replyFocus)}
                      onCompletePin={
                        item.kind === "pin"
                          ? () => completePin(item.id)
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            )}

            {hiddenCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 self-start"
                onClick={() => setShowAll(true)}
              >
                あと {hiddenCount} 件を表示
              </Button>
            )}

            {showAll && totalCount > DEFAULT_VISIBLE_ACTIONS && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 self-start"
                onClick={() => setShowAll(false)}
              >
                折りたたむ
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Input
              value={pinDraft}
              onChange={(e) => setPinDraft(e.target.value)}
              placeholder="例: サンプル到着を確認する"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") addPin();
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pinDraft.trim()}
              onClick={addPin}
              aria-label="タスクを追加"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {view.completedPins.length > 0 && (
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    completedOpen && "rotate-180",
                  )}
                  aria-hidden
                />
                完了済み（{view.completedPins.length}）
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 flex flex-col gap-1.5">
                {view.completedPins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    <span className="line-through">{pin.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => restorePin(pin.id)}
                    >
                      <Undo2 className="size-3" aria-hidden />
                      戻す
                    </Button>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
