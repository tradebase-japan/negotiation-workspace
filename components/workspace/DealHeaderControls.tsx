"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { type Deal } from "@/lib/schema";
import { getDealProgressLabel } from "@/lib/computed/deals";
import { AddItemDialog } from "@/components/workspace/AddItemDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DealHeaderControls({
  deals,
  selectedDealId,
  onSelectDeal,
  onAddDeal,
}: {
  deals: Deal[];
  selectedDealId: string;
  onSelectDeal: (id: string) => void;
  onAddDeal: (productName: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const activeDeals = deals.filter((d) => !d.archived);
  const selected = activeDeals.find((d) => d.id === selectedDealId);

  return (
    <>
      <div className="flex min-w-0 shrink items-center gap-2">
        {activeDeals.length > 1 ? (
          <Select
            value={selectedDealId}
            onValueChange={(value) => {
              if (value) onSelectDeal(value);
            }}
          >
            <SelectTrigger size="sm" className="max-w-[200px]">
              <SelectValue placeholder="案件を選択" />
            </SelectTrigger>
            <SelectContent>
              {activeDeals.map((deal) => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.productName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : selected ? (
          <span className="max-w-[180px] truncate text-sm font-medium text-foreground">
            {selected.productName}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">（案件なし）</span>
        )}

        {selected && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {getDealProgressLabel(selected)}
          </span>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="案件を追加"
          onClick={() => setAddOpen(true)}
        >
          <Plus />
        </Button>
      </div>

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="案件を追加"
        description="交渉する商品名を入力してください。"
        fieldLabel="商品名"
        fieldId="deal-product-name"
        placeholder="例: SmartView Dock 5019D"
        onAdd={onAddDeal}
      />
    </>
  );
}
