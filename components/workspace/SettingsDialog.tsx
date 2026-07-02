"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { type Region } from "@/lib/schema";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type SettingsDialogContentProps = {
  departments: Region[];
  onAddDepartment: (name: string) => void;
  onDeleteDepartment: (deptId: string) => void;
};

export function SettingsDialogContent({
  departments,
  onAddDepartment,
  onDeleteDepartment,
}: SettingsDialogContentProps) {
  const [newDeptName, setNewDeptName] = useState("");
  const [deleteDeptTarget, setDeleteDeptTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleAddDept = () => {
    const trimmed = newDeptName.trim();
    if (!trimmed) return;
    onAddDepartment(trimmed);
    setNewDeptName("");
  };

  return (
    <>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ワークスペース設定</DialogTitle>
          <DialogDescription>
            地域やワークスペース名を管理します
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="settings-new-dept">地域</FieldLabel>
            <ScrollArea className="max-h-48">
              <div className="divide-y divide-border rounded-lg border border-border">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="text-sm">{dept.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setDeleteDeptTarget({ id: dept.id, name: dept.name })
                      }
                      aria-label={`${dept.name} を削除`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    地域がありません
                  </div>
                )}
              </div>
            </ScrollArea>
            <InputGroup>
              <InputGroupInput
                id="settings-new-dept"
                placeholder="新しい地域名"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddDept();
                }}
              />
              <InputGroupAddon align="inline-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddDept}
                  disabled={!newDeptName.trim()}
                >
                  <Plus data-icon="inline-start" />
                  追加
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Separator />

          <Field>
            <FieldLabel htmlFor="settings-workspace-name">
              ワークスペース名
            </FieldLabel>
            <Input id="settings-workspace-name" defaultValue="メーカー交渉" />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">閉じる</Button>} />
        </DialogFooter>
      </DialogContent>

      <DeleteConfirmDialog
        open={deleteDeptTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDeptTarget(null);
        }}
        title="地域を削除しますか？"
        itemName={deleteDeptTarget?.name ?? ""}
        onConfirm={() => {
          if (deleteDeptTarget) {
            onDeleteDepartment(deleteDeptTarget.id);
            setDeleteDeptTarget(null);
          }
        }}
      />
    </>
  );
}
