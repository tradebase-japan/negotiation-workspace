/**
 * 選考フロー互換のステータス派生（レガシー）。
 * 新ドメインでは lib/computed/deals.ts を使用する。
 */

export type StageStatus = "done" | "planned" | "pending";

export function deriveStageStatus(
  date: string,
  decision?: string,
): StageStatus {
  if (decision && decision.trim() !== "") return "done";
  if (date && date.trim() !== "") return "planned";
  return "pending";
}
