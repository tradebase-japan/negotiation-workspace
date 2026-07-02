/**
 * 海外メーカー交渉管理ドメインの Zod スキーマと派生型。
 */

import { z } from "zod";
import {
  DEAL_TOPIC_ORDER,
  MANUFACTURER_TOPIC_ORDER,
  type DealTopicKey,
  type ManufacturerTopicKey,
} from "@/lib/negotiation-topics";

// ===== Pane 1: 地域 → メーカー 階層 =====

export const manufacturerEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number(),
});
export type ManufacturerEntry = z.infer<typeof manufacturerEntrySchema>;

export const regionSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturers: z.array(manufacturerEntrySchema),
});
export type Region = z.infer<typeof regionSchema>;

// 後方互換の別名（Pane 1 コンポーネントが Department/Position を参照）
export type Department = Region;
export type Position = ManufacturerEntry;
export const departmentSchema = regionSchema;
export const positionSchema = manufacturerEntrySchema;

// ===== メーカー共通データ =====

const topicProgressSchema = z.object({
  status: z.string(),
  memo: z.string().optional().default(""),
  chatExcerpt: z.string().optional().default(""),
  updatedAt: z.string().optional().default(""),
});

export const manufacturerSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().optional().default(""),
  primaryChannel: z.enum(["line", "wechat", "both"]).default("wechat"),
  contactPerson: z.string().optional().default(""),
  topics: z.record(z.string(), topicProgressSchema),
});
export type Manufacturer = z.infer<typeof manufacturerSchema>;

// ===== 案件ステージ（Pane 2 グループ） =====

export const dealStageKeySchema = z.enum([
  "lead",
  "pitch",
  "terms",
  "closing",
]);
export type DealStageKey = z.infer<typeof dealStageKeySchema>;
export const DEAL_STAGE_ORDER = dealStageKeySchema.options;

// ===== 確定値フィールド =====

export const termSourceSchema = z.enum(["manual", "ai", "chat"]);
export type TermSource = z.infer<typeof termSourceSchema>;

export const termConfirmationSchema = z.enum(["draft", "confirmed"]);
export type TermConfirmation = z.infer<typeof termConfirmationSchema>;

export const termFieldSchema = z.object({
  value: z.string().default(""),
  confirmation: termConfirmationSchema.default("draft"),
  source: termSourceSchema.default("manual"),
});
export type TermField = z.infer<typeof termFieldSchema>;

export const dealTermsSchema = z.object({
  moq: termFieldSchema,
  exclusivity: termFieldSchema,
  certification: termFieldSchema,
});
export type DealTerms = z.infer<typeof dealTermsSchema>;

export const changeLogEntrySchema = z.object({
  id: z.string(),
  field: z.string(),
  fromValue: z.string(),
  toValue: z.string(),
  note: z.string().optional().default(""),
  updatedAt: z.string(),
  updatedBy: z.string().optional().default(""),
});
export type ChangeLogEntry = z.infer<typeof changeLogEntrySchema>;

export const chatInboxEntrySchema = z.object({
  id: z.string(),
  content: z.string(),
  pastedAt: z.string(),
  channel: z.enum(["email", "wechat", "line", "other"]).optional().default("other"),
});
export type ChatInboxEntry = z.infer<typeof chatInboxEntrySchema>;

const txtAttachmentSchema = z.object({
  id: z.string(),
  kind: z.literal("txt"),
  name: z.string(),
  size: z.string(),
  previewText: z.string(),
});
const pdfAttachmentSchema = z.object({
  id: z.string(),
  kind: z.literal("pdf"),
  name: z.string(),
  size: z.string(),
  extractedText: z.string().optional().default(""),
});
const imageAttachmentSchema = z.object({
  id: z.string(),
  kind: z.literal("image"),
  name: z.string(),
  size: z.string(),
  dataUrl: z.string(),
});
export const attachmentSchema = z.discriminatedUnion("kind", [
  txtAttachmentSchema,
  pdfAttachmentSchema,
  imageAttachmentSchema,
]);
export type Attachment = z.infer<typeof attachmentSchema>;

// ===== 案件 =====

export const dealSchema = z.object({
  id: z.string(),
  manufacturerId: z.string(),
  productName: z.string(),
  channels: z.array(z.enum(["line", "wechat"])).default(["wechat"]),
  stage: dealStageKeySchema,
  archived: z.boolean().default(false),
  topics: z.record(z.string(), topicProgressSchema),
  terms: dealTermsSchema,
  changeLog: z.array(changeLogEntrySchema).default([]),
  chatInbox: z.array(chatInboxEntrySchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
});
export type Deal = z.infer<typeof dealSchema>;

// 後方互換別名
export type Candidate = Deal;
export const candidateSchema = dealSchema;
export const candidatesSchema = z.array(dealSchema);

// ===== JSON 全体用 =====

export const regionsSchema = z.array(regionSchema);
export const departmentsSchema = regionsSchema;
export const manufacturersDataSchema = z.array(manufacturerSchema);

export const workspaceSchema = z.object({
  name: z.string(),
  icon: z.string(),
});

// ===== Pane 4 表示状態 =====

export type SelectedDetail =
  | { type: "topic"; scope: "manufacturer" | "deal"; topicId: string }
  | null;

// ===== Pane 2 派生表示型 =====

export type DealRow = {
  id: string;
  name: string;
  channelLabel: string;
  progressLabel: string;
};

export type CandidateRow = DealRow;

export type Group =
  | {
      kind: "stage";
      stage: DealStageKey;
      label: string;
      items: DealRow[];
    }
  | { kind: "archived"; label: string; items: DealRow[] };

// ===== トピック初期化ヘルパー型 =====

export function createDefaultManufacturerTopics(): Record<
  ManufacturerTopicKey,
  z.infer<typeof topicProgressSchema>
> {
  return Object.fromEntries(
    MANUFACTURER_TOPIC_ORDER.map((key) => [
      key,
      { status: "not_started", memo: "", chatExcerpt: "", updatedAt: "" },
    ]),
  ) as Record<ManufacturerTopicKey, z.infer<typeof topicProgressSchema>>;
}

export function createDefaultDealTopics(): Record<
  DealTopicKey,
  z.infer<typeof topicProgressSchema>
> {
  return Object.fromEntries(
    DEAL_TOPIC_ORDER.map((key) => [
      key,
      { status: "not_started", memo: "", chatExcerpt: "", updatedAt: "" },
    ]),
  ) as Record<DealTopicKey, z.infer<typeof topicProgressSchema>>;
}

export function createDefaultTerms(): DealTerms {
  return {
    moq: { value: "", confirmation: "draft", source: "manual" },
    exclusivity: { value: "", confirmation: "draft", source: "manual" },
    certification: { value: "", confirmation: "draft", source: "manual" },
  };
}

// 旧スキーマ互換（テスト・段階移行用のスタブ型）
export type StageKey = DealStageKey;
export const STAGE_ORDER = DEAL_STAGE_ORDER;
