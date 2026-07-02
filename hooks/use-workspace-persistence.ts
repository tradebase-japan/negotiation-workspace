"use client";

import { useEffect, useRef, useState } from "react";

import type { Deal, Manufacturer, Region } from "@/lib/schema";
import type { WorkspaceStatePayload } from "@/lib/workspace-state";

type PersistenceStatus = "idle" | "loading" | "ready" | "saving" | "error";

type UseWorkspacePersistenceArgs = {
  initialRegions: Region[];
  initialManufacturers: Manufacturer[];
  initialDeals: Deal[];
  initialSelectedManufacturerId: string;
  initialSelectedDealId: string;
  regions: Region[];
  manufacturers: Manufacturer[];
  deals: Deal[];
  selectedManufacturerId: string;
  selectedDealId: string;
  onHydrate: (payload: WorkspaceStatePayload) => void;
};

export function useWorkspacePersistence({
  initialRegions,
  initialManufacturers,
  initialDeals,
  initialSelectedManufacturerId,
  initialSelectedDealId,
  regions,
  manufacturers,
  deals,
  selectedManufacturerId,
  selectedDealId,
  onHydrate,
}: UseWorkspacePersistenceArgs) {
  const [status, setStatus] = useState<PersistenceStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const persistenceEnabledRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHydrateRef = useRef(onHydrate);
  onHydrateRef.current = onHydrate;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/workspace-state");
        if (!response.ok) {
          throw new Error("保存データの読み込みに失敗しました");
        }

        const json = (await response.json()) as {
          configured?: boolean;
          state?: WorkspaceStatePayload | null;
        };

        if (cancelled) return;

        persistenceEnabledRef.current = Boolean(json.configured);

        if (json.configured && json.state) {
          onHydrateRef.current(json.state);
        }

        hydratedRef.current = true;
        setStatus(json.configured ? "ready" : "idle");
      } catch (error) {
        if (cancelled) return;
        hydratedRef.current = true;
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "保存データの読み込みに失敗しました",
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    initialRegions,
    initialManufacturers,
    initialDeals,
    initialSelectedManufacturerId,
    initialSelectedDealId,
  ]);

  useEffect(() => {
    if (!hydratedRef.current || !persistenceEnabledRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      setStatus((current) => (current === "loading" ? current : "saving"));

      try {
        const response = await fetch("/api/workspace-state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deals,
            manufacturers,
            regions,
            selectedManufacturerId,
            selectedDealId,
          } satisfies WorkspaceStatePayload),
        });

        if (!response.ok) {
          const json = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(json?.error ?? "保存に失敗しました");
        }

        setErrorMessage(null);
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "保存に失敗しました",
        );
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    deals,
    manufacturers,
    regions,
    selectedManufacturerId,
    selectedDealId,
  ]);

  return { status, errorMessage };
}
