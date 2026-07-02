import {
  type Deal,
  type DealStageKey,
  type Manufacturer,
  createDefaultDealTopics,
  createDefaultManufacturerTopics,
  createDefaultTerms,
} from "@/lib/schema";
import { STAGE_LABELS } from "@/lib/labels";

export function createMinimalManufacturer(
  id: string,
  name: string,
  country = "",
): Manufacturer {
  return {
    id,
    name,
    country,
    primaryChannel: "wechat",
    contactPerson: "",
    topics: createDefaultManufacturerTopics(),
  };
}

export function createMinimalDeal(
  productName: string,
  manufacturerId: string,
  stage: DealStageKey,
): Deal {
  return {
    id: `deal-${Date.now()}`,
    manufacturerId,
    productName,
    channels: ["wechat"],
    stage,
    archived: false,
    topics: createDefaultDealTopics(),
    terms: createDefaultTerms(),
    changeLog: [],
    chatInbox: [],
    attachments: [],
  };
}

/** @deprecated createMinimalDeal を使用 */
export function createMinimalProfile(name: string) {
  return { name };
}

/** @deprecated 未使用 */
export function createMinimalScorecard(stage: DealStageKey) {
  return { stage, label: STAGE_LABELS[stage] };
}
