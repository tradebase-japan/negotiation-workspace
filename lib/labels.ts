/**
 * 海外メーカー交渉管理の表示文言。
 */

import { type DealStageKey } from "@/lib/schema";

export const STAGE_LABELS: Record<DealStageKey, string> = {
  lead: "初回接触",
  pitch: "説明・提案",
  terms: "条件交渉",
  closing: "契約準備",
};

export const ARCHIVED_GROUP_LABEL = "アーカイブ済み";

export const PANE3_SECTION = {
  negotiationChecklist: "交渉チェックリスト",
  negotiationChecklistDescription: "トークの進捗と合意状況",
  confirmedTerms: "確定条件",
  confirmedTermsDescription: "MOQ・独占・認証の現在値",
  manufacturerOnboarding: "メーカー共通（説明済み）",
  chatInbox: "トーク受信箱",
  chatInboxDescription:
    "メール・WeChat・LINEのやり取りをここに貼り付け。自動でMOQ・独占などを拾います",
  attachments: "添付ファイル",
  attachmentsDescription: "PDF・写真・資料を案件ごとに保存",
  nextActions: "次にやること",
  nextActionsDescription:
    "未決の交渉項目と、自分で足したタスク。タップで詳細、返信案で下書きへ",
  workPane: "やりとり",
  workPaneDescription: "トーク解析・返信下書き",
  recordPane: "進捗・記録",
  recordPaneDescription: "チェックリスト・確定条件・添付",
  replyAssist: "返信アシスト",
  replyAssistDescription:
    "トーク履歴とチェックリストをもとに、次の返信案（英語）と方針をAIが提案します",
} as const;

export const TERM_FIELD_LABELS = {
  moq: "MOQ",
  exclusivity: "独占権",
  certification: "認証の持ち",
} as const;

export const CONFIRMATION_LABELS = {
  draft: "要確認",
  confirmed: "確定",
} as const;

export const SOURCE_LABELS = {
  manual: "手入力",
  ai: "AI抽出",
  chat: "トーク要約",
} as const;

export const CHANNEL_LABELS = {
  line: "LINE",
  wechat: "WeChat",
  both: "LINE / WeChat",
} as const;

export const PANE4_SECTION_IDS = {
  status: "pane4-status",
  template: "pane4-template",
  chat: "pane4-chat",
  terms: "pane4-terms",
  changelog: "pane4-changelog",
} as const;

// 旧ラベル互換（他コンポーネントが参照している場合）
export const EVALUATION_AXIS = {} as const;
export const PANE4_SECTION_IDS_LEGACY = {
  m2: PANE4_SECTION_IDS,
} as const;
