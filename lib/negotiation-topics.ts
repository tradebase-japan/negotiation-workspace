/**
 * 海外メーカー交渉チェックリストの定義（トピック・ステータス・テンプレ文）。
 * Pane 3 チェックリスト / Pane 4 詳細の SSoT。
 */

// ===== メーカー共通（説明系） =====

export const MANUFACTURER_TOPIC_ORDER = [
  "business_model",
  "crowdfunding",
  "four_step_channel",
  "cost_coverage",
  "pre_marketing",
] as const;

export type ManufacturerTopicKey = (typeof MANUFACTURER_TOPIC_ORDER)[number];

export const MANUFACTURER_TOPIC_STATUS = {
  business_model: [
    "not_started",
    "explained",
    "acknowledged",
    "no_response",
  ],
  crowdfunding: ["not_started", "explained", "acknowledged", "no_response"],
  four_step_channel: [
    "not_started",
    "explained",
    "acknowledged",
    "no_response",
  ],
  cost_coverage: ["not_started", "explained", "acknowledged", "no_response"],
  pre_marketing: ["not_started", "explained", "acknowledged", "no_response"],
} as const satisfies Record<
  ManufacturerTopicKey,
  readonly string[]
>;

// ===== 案件ごと（交渉系） =====

export const DEAL_TOPIC_ORDER = [
  "exclusivity",
  "moq",
  "certification",
  "price",
  "schedule",
] as const;

export type DealTopicKey = (typeof DEAL_TOPIC_ORDER)[number];

export const DEAL_TOPIC_STATUS = {
  exclusivity: [
    "not_started",
    "explained",
    "agreed",
    "rejected_oem_only",
    "negotiating",
    "no_response",
  ],
  moq: [
    "not_started",
    "explained",
    "zero_ok",
    "quantity_proposed",
    "rejected",
    "negotiating",
    "no_response",
  ],
  certification: [
    "not_started",
    "checking",
    "holder_ours",
    "holder_manufacturer",
    "holder_shared",
    "undecided",
    "no_response",
  ],
  price: [
    "not_started",
    "explained",
    "negotiating",
    "agreed",
    "rejected",
    "no_response",
  ],
  schedule: [
    "not_started",
    "explained",
    "agreed",
    "pending",
    "no_response",
  ],
} as const satisfies Record<DealTopicKey, readonly string[]>;

export type NegotiationTopicKey =
  | ManufacturerTopicKey
  | DealTopicKey;

export type TopicScope = "manufacturer" | "deal";

export function isManufacturerTopic(
  key: string,
): key is ManufacturerTopicKey {
  return (MANUFACTURER_TOPIC_ORDER as readonly string[]).includes(key);
}

export function isDealTopic(key: string): key is DealTopicKey {
  return (DEAL_TOPIC_ORDER as readonly string[]).includes(key);
}

// ===== 表示ラベル =====

export const MANUFACTURER_TOPIC_LABELS: Record<ManufacturerTopicKey, string> = {
  business_model: "ビジネスモデル説明",
  crowdfunding: "クラウドファンディング説明",
  four_step_channel: "4ステップ販売チャネル",
  cost_coverage: "費用負担の説明",
  pre_marketing: "プレマーケティング",
};

export const DEAL_TOPIC_LABELS: Record<DealTopicKey, string> = {
  exclusivity: "独占性",
  moq: "MOQ（最低発注数量）",
  certification: "認証・PSE",
  price: "価格交渉",
  schedule: "スケジュール",
};

export const TOPIC_STATUS_LABELS: Record<string, string> = {
  not_started: "未着手",
  explained: "説明済",
  acknowledged: "理解確認済",
  no_response: "未回答",
  agreed: "合意",
  rejected_oem_only: "NG（OEMのみ可）",
  negotiating: "交渉中",
  zero_ok: "MOQゼロOK",
  quantity_proposed: "数量提示あり",
  rejected: "拒否",
  checking: "要否確認中",
  holder_ours: "自社持ち",
  holder_manufacturer: "メーカー持ち",
  holder_shared: "共同",
  undecided: "未定",
  pending: "保留",
};

// ===== テンプレ文（Pane 4 コピー用） =====

export const TOPIC_TEMPLATES: Partial<Record<NegotiationTopicKey, string>> = {
  business_model: `お時間をいただきありがとうございます。
当社は日本の販売代理店および輸入業者です。
まずは、私たちのビジネスについて説明をさせてください。`,

  crowdfunding: `クラウドファンディングとは、インターネット上で多くの人から資金を集める方法です。
私たちは、マーケティングツールとしてクラウドファンディングを活用しています。
Makuake（https://www.makuake.com/）は、新しい商品がたくさん紹介されている日本のクラウドファンディングプラットフォームです。`,

  four_step_channel: `御社の製品を日本市場に販売するには、基本的に4つのステップが必要になります。
1. Makuakeでのクラウドファンディング
2. 楽天・Amazon・Yahoo等のネット販売
3. ヨドバシカメラ、ビックカメラ、東急ハンズ、LOFTなどの実店舗販売
4. 東京ギフトショーでの販売経路の拡充`,

  cost_coverage: `翻訳費用、国際配送料、税金、関税、国内配送料、販売代理店料、マーケティング費用は当社が負担します。
プレマーケティングも当社の費用で行われますので、ご安心ください。`,

  pre_marketing: `LINEの連絡先が増えれば増えるほど、売上も増える傾向にあります。
私たちはこの活動をプレマーケティングと呼んでいます。
実際、プレマーケティングはプロジェクトを成功させるための鍵です。`,

  exclusivity: `キャンペーンを実施する際には、日本に他に代理店がないことを確認する必要があるため、1つのアイテムに対して一定期間の独占契約を結ぶ必要があります。
私たちはあなたの商品をあなたのブランドで販売したいと考えています。
日本国内に限り、1点からでも大丈夫です。よろしいでしょうか？`,

  moq: `マーケティングに投資する必要があり、Makuakeが手数料として22%を徴収するので、クラウドファンディングのみで最小注文数なしで作業したいです。
国際配送料、税金、関税、国内配送料も支払います。
クラウドファンディングの段階のみで最小注文数なしで作業しても大丈夫ですか？`,

  certification: `最後に確認しておきたいのは証明書です。
PSE → 製品はコンセントで使用する必要がありますか？
証明書が必要かどうか確認させていただきます。`,

  price: `日本市場における貴社の製品の価格設定と流通戦略についてお話ししたいのですが。
通常、日本での小売価格は、購入価格の約4〜5倍です。
小売価格を下げることで、日本中に流通できるよう設計したいと考えています。
購入価格を下げることは可能かお伺いいたします。`,

  schedule: `契約締結後の暫定スケジュールは以下の通りです。
・3〜4週間 ページ作成
・4〜5週間 プレマーケティング（広告出稿）
・5〜8週間 キャンペーン期間
・5〜8週間 支援者全員への商品お届け`,
};

export function getTopicLabel(
  scope: TopicScope,
  topicId: string,
): string {
  if (scope === "manufacturer" && isManufacturerTopic(topicId)) {
    return MANUFACTURER_TOPIC_LABELS[topicId];
  }
  if (scope === "deal" && isDealTopic(topicId)) {
    return DEAL_TOPIC_LABELS[topicId];
  }
  return topicId;
}

export function getStatusOptions(
  scope: TopicScope,
  topicId: string,
): readonly string[] {
  if (scope === "manufacturer" && isManufacturerTopic(topicId)) {
    return MANUFACTURER_TOPIC_STATUS[topicId];
  }
  if (scope === "deal" && isDealTopic(topicId)) {
    return DEAL_TOPIC_STATUS[topicId];
  }
  return ["not_started"];
}
