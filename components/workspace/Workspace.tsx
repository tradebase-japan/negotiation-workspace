"use client";

import { useState, useCallback, useMemo } from "react";

import { useWorkspacePersistence } from "@/hooks/use-workspace-persistence";
import type { WorkspaceStatePayload } from "@/lib/workspace-state";

import {
  type Region,
  type Manufacturer,
  type Deal,
  type SelectedDetail,
  type DealTerms,
} from "@/lib/schema";
import { createMinimalDeal, createMinimalManufacturer } from "@/lib/data/factories";
import {
  analyzeChatText,
  type ChatAnalysisResult,
  type ChatSuggestion,
} from "@/lib/chat-analyzer";
import { getAttachmentTextContent } from "@/lib/attachment-text";
import { looksLikeChatHistory } from "@/lib/pdf-extract";
import { filesToAttachments } from "@/components/workspace/DealAttachmentsCard";
import { resolveSuggestionExcerpt } from "@/lib/chat-excerpt";
import { getDealProgressSummary } from "@/lib/computed/deals";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GlobalHeader } from "@/components/workspace/GlobalHeader";
import { PositionPane } from "@/components/workspace/PositionPane";
import { CandidateDashboardPane } from "@/components/workspace/CandidateDashboardPane";
import { CandidateDetailPane } from "@/components/workspace/CandidateDetailPane";

type WorkspaceProps = {
  initialRegions: Region[];
  initialManufacturers: Manufacturer[];
  initialDeals: Deal[];
  workspace: { name: string; icon: string };
};

export function Workspace({
  initialRegions,
  initialManufacturers,
  initialDeals,
  workspace,
}: WorkspaceProps) {
  const [regions, setRegions] = useState<Region[]>(initialRegions);
  const [manufacturers, setManufacturers] =
    useState<Manufacturer[]>(initialManufacturers);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [selectedManufacturerId, setSelectedManufacturerId] =
    useState<string>("m-xfanic");
  const [selectedDealId, setSelectedDealId] = useState<string>("deal-xfanic-5019d");
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail>(null);
  const [scrollAnchor, setScrollAnchor] = useState<string | null>(null);
  const [pane4ManuallyClosed, setPane4ManuallyClosed] = useState(false);
  const [externalInboxAnalysis, setExternalInboxAnalysis] = useState<
    (ChatAnalysisResult & { entryId: string }) | null
  >(null);

  const hydrateFromDatabase = useCallback((payload: WorkspaceStatePayload) => {
    setRegions(payload.regions);
    setManufacturers(payload.manufacturers);
    setDeals(payload.deals);
    setSelectedManufacturerId(payload.selectedManufacturerId);
    setSelectedDealId(payload.selectedDealId);
    setSelectedDetail(null);
    setPane4ManuallyClosed(false);
    setExternalInboxAnalysis(null);
  }, []);

  const { status: persistenceStatus, errorMessage: persistenceError } =
    useWorkspacePersistence({
      initialRegions,
      initialManufacturers,
      initialDeals,
      initialSelectedManufacturerId: "m-xfanic",
      initialSelectedDealId: "deal-xfanic-5019d",
      regions,
      manufacturers,
      deals,
      selectedManufacturerId,
      selectedDealId,
      onHydrate: hydrateFromDatabase,
    });

  const pane4Open = selectedDetail !== null && !pane4ManuallyClosed;

  const activeManufacturer = useMemo(() => {
    const found = manufacturers.find((m) => m.id === selectedManufacturerId);
    if (found) return found;
    for (const r of regions) {
      const entry = r.manufacturers.find((m) => m.id === selectedManufacturerId);
      if (entry) {
        return createMinimalManufacturer(entry.id, entry.name, r.name);
      }
    }
    return undefined;
  }, [manufacturers, regions, selectedManufacturerId]);

  const regionsWithCounts = useMemo(
    () =>
      regions.map((r) => ({
        ...r,
        manufacturers: r.manufacturers.map((m) => ({
          ...m,
          count: deals.filter(
            (d) => d.manufacturerId === m.id && !d.archived,
          ).length,
        })),
      })),
    [regions, deals],
  );

  const manufacturerDeals = useMemo(
    () =>
      activeManufacturer
        ? deals.filter((d) => d.manufacturerId === activeManufacturer.id)
        : [],
    [deals, activeManufacturer],
  );

  const activeDeal = manufacturerDeals.find((d) => d.id === selectedDealId);

  const openDetail = useCallback(
    (next: SelectedDetail, anchor?: string) => {
      setSelectedDetail(next);
      setScrollAnchor(anchor ?? null);
      setPane4ManuallyClosed(false);
    },
    [],
  );

  const selectDeal = useCallback((id: string) => {
    setSelectedDealId(id);
    setSelectedDetail(null);
    setPane4ManuallyClosed(false);
    setExternalInboxAnalysis(null);
  }, []);

  const selectManufacturer = useCallback(
    (manufacturerId: string) => {
      setSelectedManufacturerId(manufacturerId);
      setExternalInboxAnalysis(null);

      setManufacturers((prev) => {
        if (prev.some((m) => m.id === manufacturerId)) return prev;
        for (const r of regions) {
          const entry = r.manufacturers.find((m) => m.id === manufacturerId);
          if (entry) {
            return [
              ...prev,
              createMinimalManufacturer(entry.id, entry.name, r.name),
            ];
          }
        }
        return prev;
      });

      const existing = deals.filter((d) => d.manufacturerId === manufacturerId);
      if (existing.length > 0) {
        setSelectedDealId(
          existing.find((d) => d.id === selectedDealId)?.id ?? existing[0].id,
        );
      } else {
        const newDeal = createMinimalDeal("新規商品", manufacturerId, "lead");
        setDeals((prev) => [...prev, newDeal]);
        setSelectedDealId(newDeal.id);
      }

      setSelectedDetail(null);
      setPane4ManuallyClosed(false);
    },
    [deals, regions, selectedDealId],
  );

  const addDeal = useCallback(
    (productName: string) => {
      const newDeal = createMinimalDeal(
        productName,
        selectedManufacturerId,
        "terms",
      );
      setDeals((prev) => [...prev, newDeal]);
      setSelectedDealId(newDeal.id);
      setSelectedDetail(null);
      setPane4ManuallyClosed(false);
      setExternalInboxAnalysis(null);
    },
    [selectedManufacturerId],
  );

  const updateDealTopic = useCallback(
    (
      dealId: string,
      topicId: string,
      patch: Partial<Deal["topics"][string]>,
    ) => {
      setDeals((prev) =>
        prev.map((d) => {
          if (d.id !== dealId) return d;
          const current = d.topics[topicId] ?? {
            status: "not_started",
            memo: "",
            chatExcerpt: "",
            updatedAt: "",
          };
          return {
            ...d,
            topics: {
              ...d.topics,
              [topicId]: {
                ...current,
                ...patch,
                updatedAt: new Date().toISOString().slice(0, 10),
              },
            },
          };
        }),
      );
    },
    [],
  );

  const updateManufacturerTopic = useCallback(
    (
      manufacturerId: string,
      topicId: string,
      patch: Partial<Manufacturer["topics"][string]>,
    ) => {
      setManufacturers((prev) =>
        prev.map((m) => {
          if (m.id !== manufacturerId) return m;
          const current = m.topics[topicId] ?? {
            status: "not_started",
            memo: "",
            chatExcerpt: "",
            updatedAt: "",
          };
          return {
            ...m,
            topics: {
              ...m.topics,
              [topicId]: {
                ...current,
                ...patch,
                updatedAt: new Date().toISOString().slice(0, 10),
              },
            },
          };
        }),
      );
    },
    [],
  );

  const updateDealTerms = useCallback(
    (dealId: string, field: keyof DealTerms, value: string) => {
      setDeals((prev) =>
        prev.map((d) => {
          if (d.id !== dealId) return d;
          const prevField = d.terms[field];
          const nextTerms = {
            ...d.terms,
            [field]: { ...prevField, value, source: "manual" as const },
          };
          const log =
            prevField.value !== value && value.trim() !== ""
              ? [
                  ...d.changeLog,
                  {
                    id: `log-${Date.now()}`,
                    field,
                    fromValue: prevField.value || "（空）",
                    toValue: value,
                    note: "",
                    updatedAt: new Date().toISOString().slice(0, 10),
                    updatedBy: "",
                  },
                ]
              : d.changeLog;
          return { ...d, terms: nextTerms, changeLog: log };
        }),
      );
    },
    [],
  );

  const confirmDealTerm = useCallback(
    (dealId: string, field: keyof DealTerms) => {
      setDeals((prev) =>
        prev.map((d) => {
          if (d.id !== dealId) return d;
          return {
            ...d,
            terms: {
              ...d.terms,
              [field]: {
                ...d.terms[field],
                confirmation: "confirmed" as const,
              },
            },
          };
        }),
      );
    },
    [],
  );

  const applySuggestion = useCallback(
    (suggestion: ChatSuggestion, inboxEntryId: string) => {
      const deal = deals.find((d) => d.id === selectedDealId);
      const fullContent =
        deal?.chatInbox.find((e) => e.id === inboxEntryId)?.content ?? "";
      const excerpt = resolveSuggestionExcerpt(
        fullContent,
        suggestion.scope,
        suggestion.topicId,
        suggestion.excerpt,
      );

      if (suggestion.scope === "manufacturer" && activeManufacturer) {
        setManufacturers((prev) =>
          prev.map((m) => {
            if (m.id !== activeManufacturer.id) return m;
            const current = m.topics[suggestion.topicId] ?? {
              status: "not_started",
              memo: "",
              chatExcerpt: "",
              updatedAt: "",
            };
            return {
              ...m,
              topics: {
                ...m.topics,
                [suggestion.topicId]: {
                  ...current,
                  status: suggestion.status ?? current.status,
                  memo: suggestion.memo ?? current.memo,
                  chatExcerpt: suggestion.excerpt ?? excerpt,
                  updatedAt: new Date().toISOString().slice(0, 10),
                },
              },
            };
          }),
        );
      }

      if (suggestion.scope === "deal") {
        setDeals((prev) =>
          prev.map((d) => {
            if (d.id !== selectedDealId) return d;
            const current = d.topics[suggestion.topicId] ?? {
              status: "not_started",
              memo: "",
              chatExcerpt: "",
              updatedAt: "",
            };
            const nextTerms = { ...d.terms };
            if (suggestion.termField && suggestion.termValue) {
              nextTerms[suggestion.termField] = {
                value: suggestion.termValue,
                confirmation: "draft",
                source: "ai",
              };
            }
            return {
              ...d,
              topics: {
                ...d.topics,
                [suggestion.topicId]: {
                  ...current,
                  status: suggestion.status ?? current.status,
                  memo: suggestion.memo ?? current.memo,
                  chatExcerpt: suggestion.excerpt ?? excerpt,
                  updatedAt: new Date().toISOString().slice(0, 10),
                },
              },
              terms: nextTerms,
            };
          }),
        );
      }
    },
    [deals, selectedDealId, activeManufacturer],
  );

  const applyAllSuggestions = useCallback(
    (suggestions: ChatSuggestion[], inboxEntryId: string) => {
      const deal = deals.find((d) => d.id === selectedDealId);
      const fullContent =
        deal?.chatInbox.find((e) => e.id === inboxEntryId)?.content ?? "";
      const today = new Date().toISOString().slice(0, 10);

      const mfrSuggestions = suggestions.filter((s) => s.scope === "manufacturer");
      if (mfrSuggestions.length > 0 && activeManufacturer) {
        setManufacturers((prev) =>
          prev.map((m) => {
            if (m.id !== activeManufacturer.id) return m;
            let topics = { ...m.topics };
            for (const s of mfrSuggestions) {
              const current = topics[s.topicId] ?? {
                status: "not_started",
                memo: "",
                chatExcerpt: "",
                updatedAt: "",
              };
              const excerpt = resolveSuggestionExcerpt(
                fullContent,
                s.scope,
                s.topicId,
                s.excerpt,
              );
              topics = {
                ...topics,
                [s.topicId]: {
                  ...current,
                  status: s.status ?? current.status,
                  memo: s.memo ?? current.memo,
                  chatExcerpt: excerpt,
                  updatedAt: today,
                },
              };
            }
            return { ...m, topics };
          }),
        );
      }

      const dealSuggestions = suggestions.filter((s) => s.scope === "deal");
      if (dealSuggestions.length > 0) {
        setDeals((prev) =>
          prev.map((d) => {
            if (d.id !== selectedDealId) return d;
            let topics = { ...d.topics };
            let terms = { ...d.terms };
            for (const s of dealSuggestions) {
              const current = topics[s.topicId] ?? {
                status: "not_started",
                memo: "",
                chatExcerpt: "",
                updatedAt: "",
              };
              const excerpt = resolveSuggestionExcerpt(
                fullContent,
                s.scope,
                s.topicId,
                s.excerpt,
              );
              topics = {
                ...topics,
                [s.topicId]: {
                  ...current,
                  status: s.status ?? current.status,
                  memo: s.memo ?? current.memo,
                  chatExcerpt: excerpt,
                  updatedAt: today,
                },
              };
              if (s.termField && s.termValue) {
                terms = {
                  ...terms,
                  [s.termField]: {
                    value: s.termValue,
                    confirmation: "draft" as const,
                    source: "ai" as const,
                  },
                };
              }
            }
            return { ...d, topics, terms };
          }),
        );
      }
    },
    [deals, selectedDealId, activeManufacturer],
  );

  const pasteChat = useCallback(
    (content: string, sourceLabel?: string) => {
      const entryId = `inbox-${Date.now()}`;
      const displayContent = sourceLabel
        ? `[${sourceLabel}]\n\n${content}`
        : content;
      const entry = {
        id: entryId,
        content: displayContent,
        pastedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        channel: "other" as const,
      };
      setDeals((prev) =>
        prev.map((d) =>
          d.id === selectedDealId
            ? { ...d, chatInbox: [...(d.chatInbox ?? []), entry] }
            : d,
        ),
      );
      const result = { ...analyzeChatText(content), entryId };
      setExternalInboxAnalysis(result);
      return result;
    },
    [selectedDealId],
  );

  const analyzeAttachment = useCallback(
    (attachmentId: string) => {
      const deal = deals.find((d) => d.id === selectedDealId);
      const att = deal?.attachments.find((a) => a.id === attachmentId);
      if (!att) return;
      const text = getAttachmentTextContent(att).trim();
      if (!text) return;
      const label = att.kind === "pdf" ? "PDF" : "テキスト";
      pasteChat(text, `${label}: ${att.name}`);
    },
    [deals, selectedDealId, pasteChat],
  );

  const addAttachments = useCallback(
    async (files: FileList) => {
      const newItems = await filesToAttachments(files);
      setDeals((prev) =>
        prev.map((d) =>
          d.id === selectedDealId
            ? {
                ...d,
                attachments: [...(d.attachments ?? []), ...newItems],
              }
            : d,
        ),
      );
      const chatFile = newItems.find((item) => {
        if (item.kind !== "pdf" && item.kind !== "txt") return false;
        return looksLikeChatHistory(getAttachmentTextContent(item));
      });
      if (chatFile) {
        const text = getAttachmentTextContent(chatFile).trim();
        if (!text) return;
        const label = chatFile.kind === "pdf" ? "PDF" : "テキスト";
        pasteChat(text, `${label}: ${chatFile.name}`);
      }
    },
    [selectedDealId, pasteChat],
  );

  const addRegion = useCallback((name: string) => {
    setRegions((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, name, manufacturers: [] },
    ]);
  }, []);

  const deleteRegion = useCallback((regionId: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== regionId));
  }, []);

  const addManufacturer = useCallback(
    (regionId: string, name: string) => {
      const id = `m-${Date.now()}`;
      const region = regions.find((r) => r.id === regionId);
      const newManufacturer = createMinimalManufacturer(
        id,
        name,
        region?.name ?? "",
      );
      const newDeal = createMinimalDeal("新規商品", id, "lead");

      setRegions((prev) =>
        prev.map((r) =>
          r.id === regionId
            ? {
                ...r,
                manufacturers: [
                  ...r.manufacturers,
                  { id, name, count: 1 },
                ],
              }
            : r,
        ),
      );
      setManufacturers((prev) => [...prev, newManufacturer]);
      setDeals((prev) => [...prev, newDeal]);
      setSelectedManufacturerId(id);
      setSelectedDealId(newDeal.id);
      setSelectedDetail(null);
      setPane4ManuallyClosed(false);
    },
    [regions],
  );

  const deleteManufacturer = useCallback(
    (regionId: string, manufacturerId: string) => {
      const nextRegions = regions.map((r) =>
        r.id === regionId
          ? {
              ...r,
              manufacturers: r.manufacturers.filter(
                (m) => m.id !== manufacturerId,
              ),
            }
          : r,
      );
      const nextManufacturers = manufacturers.filter(
        (m) => m.id !== manufacturerId,
      );
      const nextDeals = deals.filter(
        (d) => d.manufacturerId !== manufacturerId,
      );

      setRegions(nextRegions);
      setManufacturers(nextManufacturers);
      setDeals(nextDeals);

      if (selectedManufacturerId === manufacturerId) {
        const fallbackManufacturer = nextRegions.flatMap(
          (r) => r.manufacturers,
        )[0];
        if (fallbackManufacturer) {
          setSelectedManufacturerId(fallbackManufacturer.id);
          const fallbackDeal = nextDeals.find(
            (d) =>
              d.manufacturerId === fallbackManufacturer.id && !d.archived,
          );
          setSelectedDealId(fallbackDeal?.id ?? "");
        } else {
          setSelectedManufacturerId("");
          setSelectedDealId("");
        }
        setSelectedDetail(null);
        setPane4ManuallyClosed(false);
        setExternalInboxAnalysis(null);
      }
    },
    [regions, manufacturers, deals, selectedManufacturerId],
  );

  const consumeScrollAnchor = useCallback(() => setScrollAnchor(null), []);
  const togglePane4 = useCallback(() => setPane4ManuallyClosed((v) => !v), []);

  const selectedRegion = regionsWithCounts.find((r) =>
    r.manufacturers.some((m) => m.id === selectedManufacturerId),
  );
  const regionTitle = selectedRegion?.name ?? "地域";
  const manufacturerTitle = activeManufacturer?.name ?? "メーカー";

  if (!activeManufacturer) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        メーカーを選択してください
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen
      className="h-svh max-h-svh w-full overflow-hidden bg-background text-foreground"
    >
      <PositionPane
        workspaceName={workspace.name}
        departments={regionsWithCounts}
        selectedManufacturerId={selectedManufacturerId}
        onAddPosition={addManufacturer}
        onDeletePosition={deleteManufacturer}
        onSelectManufacturer={selectManufacturer}
        addPositionLabel="メーカーを追加"
      />
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <GlobalHeader
          departmentTitle={regionTitle}
          positionTitle={manufacturerTitle}
          deals={manufacturerDeals}
          selectedDealId={selectedDealId}
          onSelectDeal={selectDeal}
          onAddDeal={addDeal}
          departments={regionsWithCounts}
          onAddDepartment={addRegion}
          onDeleteDepartment={deleteRegion}
          persistenceStatus={persistenceStatus}
          persistenceError={persistenceError}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {activeDeal ? (
            <>
              <CandidateDashboardPane
                deal={activeDeal}
                manufacturer={activeManufacturer}
                selectedDetail={selectedDetail}
                onOpenDetail={openDetail}
                progressSummary={getDealProgressSummary(activeDeal)}
                onPasteChat={pasteChat}
                onApplySuggestion={applySuggestion}
                onApplyAllSuggestions={applyAllSuggestions}
                onAddAttachments={addAttachments}
                onAnalyzeAttachment={analyzeAttachment}
                externalInboxAnalysis={externalInboxAnalysis}
                onConsumeExternalAnalysis={() => setExternalInboxAnalysis(null)}
              />
              <CandidateDetailPane
                deal={activeDeal}
                manufacturer={activeManufacturer}
                selectedDetail={selectedDetail}
                scrollAnchor={scrollAnchor}
                onScrollAnchorConsumed={consumeScrollAnchor}
                onUpdateDealTopic={updateDealTopic}
                onUpdateManufacturerTopic={updateManufacturerTopic}
                onUpdateDealTerms={updateDealTerms}
                onConfirmDealTerm={confirmDealTerm}
                pane4Open={pane4Open}
                onTogglePane4={togglePane4}
              />
            </>
          ) : (
            <section className="flex min-w-0 flex-1 items-center justify-center bg-canvas px-8 text-center text-sm text-muted-foreground">
              右上の「＋」から案件を追加すると、交渉チェックリストが表示されます
            </section>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
