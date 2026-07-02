"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { type Region } from "@/lib/schema";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Pane1Toggle } from "@/components/workspace/Pane1Toggle";
import { AddItemDialog } from "@/components/workspace/AddItemDialog";

type PositionPaneProps = {
  workspaceName: string;
  departments: Region[];
  selectedManufacturerId?: string;
  onAddPosition: (deptId: string, posName: string) => void;
  onDeletePosition: (deptId: string, posId: string) => void;
  onSelectManufacturer: (manufacturerId: string) => void;
  addPositionLabel?: string;
};

export function PositionPane({
  workspaceName,
  departments,
  selectedManufacturerId,
  onAddPosition,
  onDeletePosition,
  onSelectManufacturer,
  addPositionLabel = "メーカーを追加",
}: PositionPaneProps) {
  const [addDialogDeptId, setAddDialogDeptId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    deptId: string;
    posId: string;
    posName: string;
  } | null>(null);

  const addDialogDept = departments.find((d) => d.id === addDialogDeptId);

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border [&_[data-slot=sidebar-container]]:bg-sidebar"
      >
        <SidebarHeader className="border-b border-sidebar-border p-0">
          <div className="flex h-12 items-center justify-between gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[state=expanded]:px-4">
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <h2 className="truncate text-sm font-semibold text-sidebar-foreground">
                {workspaceName}
              </h2>
              <p className="text-[9px] tracking-widest text-sidebar-foreground/60 uppercase">
                Negotiation Console
              </p>
            </div>
            <Pane1Toggle />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-1 py-3 group-data-[collapsible=icon]:hidden">
          {departments.map((dept) => (
            <SidebarGroup key={dept.id} className="px-1">
              <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
                {dept.name}
              </SidebarGroupLabel>
              <SidebarGroupAction
                title={`${dept.name} にメーカーを追加`}
                onClick={() => setAddDialogDeptId(dept.id)}
                className="w-6 rounded-[min(var(--radius-md),10px)] text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-3"
              >
                <Plus />
                <span className="sr-only">{dept.name} にメーカーを追加</span>
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {dept.manufacturers.map((mfr) => {
                    const active = mfr.id === selectedManufacturerId;
                    return (
                      <SidebarMenuItem key={mfr.id}>
                        <SidebarMenuButton
                          tooltip={mfr.name}
                          isActive={active}
                          aria-current={active ? "page" : undefined}
                          onClick={() => onSelectManufacturer(mfr.id)}
                        >
                          <span className="truncate">{mfr.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                            {mfr.count}
                          </span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <SidebarMenuAction showOnHover>
                                <MoreHorizontal />
                                <span className="sr-only">操作</span>
                              </SidebarMenuAction>
                            }
                          />
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  setDeleteTarget({
                                    deptId: dept.id,
                                    posId: mfr.id,
                                    posName: mfr.name,
                                  })
                                }
                              >
                                <Trash2 />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      {addDialogDept && (
        <AddItemDialog
          open={addDialogDeptId !== null}
          onOpenChange={(open) => {
            if (!open) setAddDialogDeptId(null);
          }}
          title={addPositionLabel}
          description={`${addDialogDept.name} に新しいメーカーを追加します`}
          fieldLabel="メーカー名"
          fieldId="mfr-name"
          placeholder="例: 深圳テック社"
          onAdd={(name) => onAddPosition(addDialogDept.id, name)}
        />
      )}

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="メーカーを削除しますか？"
        itemName={deleteTarget?.posName ?? ""}
        onConfirm={() => {
          if (deleteTarget) {
            onDeletePosition(deleteTarget.deptId, deleteTarget.posId);
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
