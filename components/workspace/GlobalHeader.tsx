"use client";

import { Settings } from "lucide-react";

import { type Deal, type Region } from "@/lib/schema";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DealHeaderControls } from "@/components/workspace/DealHeaderControls";
import { SettingsDialogContent } from "@/components/workspace/SettingsDialog";

type GlobalHeaderProps = {
  departmentTitle: string;
  positionTitle: string;
  deals: Deal[];
  selectedDealId: string;
  onSelectDeal: (id: string) => void;
  onAddDeal: (productName: string) => void;
  departments: Region[];
  onAddDepartment: (name: string) => void;
  onDeleteDepartment: (deptId: string) => void;
};

export function GlobalHeader({
  departmentTitle,
  positionTitle,
  deals,
  selectedDealId,
  onSelectDeal,
  onAddDeal,
  departments,
  onAddDepartment,
  onDeleteDepartment,
}: GlobalHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <Breadcrumb
        className="hidden min-w-0 shrink overflow-hidden sm:block"
        aria-label="パンくず"
      >
        <BreadcrumbList className="flex-nowrap text-[11px]">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink>{departmentTitle}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-medium">
              {positionTitle}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="min-w-0 flex-1 sm:hidden">
        <p className="truncate text-sm font-medium">{positionTitle}</p>
      </div>

      <DealHeaderControls
        deals={deals}
        selectedDealId={selectedDealId}
        onSelectDeal={onSelectDeal}
        onAddDeal={onAddDeal}
      />

      <Dialog>
        <Tooltip>
          <TooltipTrigger
            render={
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="ワークスペース設定"
                  >
                    <Settings />
                  </Button>
                }
              />
            }
          />
          <TooltipContent side="bottom">ワークスペース設定</TooltipContent>
        </Tooltip>
        <SettingsDialogContent
          departments={departments}
          onAddDepartment={onAddDepartment}
          onDeleteDepartment={onDeleteDepartment}
        />
      </Dialog>
    </header>
  );
}
