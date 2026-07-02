import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "第8講義 提出物 | メーカー交渉ワークスペース",
  description: "Vercel公開アプリとNeon永続化の図解まとめ",
};

const APP_URL = "https://negotiation-workspace.vercel.app";

export default function SubmissionPage() {
  return (
    <div className="min-h-full overflow-y-auto bg-[#f4f4f2] text-foreground">
      <header className="border-b border-[#d4d4d0] bg-[#1a4547] px-6 py-8 text-white">
        <p className="text-xs font-medium tracking-wide text-teal-100/80">
          第8講義 提出物
        </p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">
          メーカー交渉ワークスペース
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-teal-50/90">
          海外メーカーとの WeChat / LINE / メール交渉を、受信箱中心のコンソールUIで整理し、
          Neon（PostgreSQL）に永続化するツールです。
        </p>
        <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg bg-white/10 px-4 py-3">
            <dt className="text-teal-100/80">公開アプリ URL</dt>
            <dd className="mt-1 font-medium break-all">
              <Link href={APP_URL} className="underline underline-offset-2">
                {APP_URL}
              </Link>
            </dd>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-3">
            <dt className="text-teal-100/80">図解 URL（このページ）</dt>
            <dd className="mt-1 font-medium break-all">
              {APP_URL}/submission
            </dd>
          </div>
        </dl>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* 1. 画面キャプチャ */}
        <Section title="1. ツールの画面" id="screens">
          <p className="mb-4 text-sm text-muted-foreground">
            実際の画面構成（ダミーデータ）。個人情報・機密情報は含みません。
          </p>
          <div className="overflow-hidden rounded-xl border border-[#d4d4d0] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#d4d4d0] bg-[#1a4547] px-4 py-2 text-xs text-white">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-green-400" />
              <span className="ml-2 opacity-80">Negotiation Console</span>
            </div>

            <div className="grid min-h-[420px] grid-cols-[140px_1fr_1.1fr_280px] text-[10px] leading-snug md:text-[11px]">
              {/* Sidebar */}
              <div className="border-r border-[#2a5557] bg-[#1a4547] p-2 text-teal-50">
                <p className="mb-2 font-semibold text-teal-100/70">地域</p>
                <p className="rounded bg-teal-900/50 px-2 py-1">中国</p>
                <p className="mt-1 rounded bg-white/15 px-2 py-1 font-medium">
                  Clickgaming
                </p>
                <p className="mt-3 font-semibold text-teal-100/70">案件</p>
                <p className="rounded bg-white/15 px-2 py-1">新規商品</p>
              </div>

              {/* Workbench */}
              <div className="border-r border-[#d4d4d0] bg-[#f9faf9] p-3">
                <p className="mb-2 font-semibold">作業台 · トーク受信箱</p>
                <div className="rounded border border-dashed border-teal-300 bg-teal-50/50 p-2 text-muted-foreground">
                  メール・WeChat・LINEを貼り付け → 解析
                </div>
                <p className="mt-3 font-semibold">拾った未決事項</p>
                <ul className="mt-1 space-y-1">
                  <li className="rounded border border-border bg-white px-2 py-1">
                    MOQ 500pcs? <span className="text-teal-700">反映</span>
                  </li>
                  <li className="rounded border border-border bg-white px-2 py-1">
                    独占条件 <span className="text-teal-700">返信案</span>
                  </li>
                </ul>
              </div>

              {/* Table */}
              <div className="border-r border-[#d4d4d0] bg-[#ececea] p-3">
                <p className="mb-2 font-semibold">交渉表</p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-1">項目</th>
                      <th className="pb-1 text-right">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["MOQ", "交渉中"],
                      ["独占性", "未着手"],
                      ["認証・PSE", "確認中"],
                      ["価格", "合意"],
                    ].map(([label, status]) => (
                      <tr key={label} className="border-t border-border/60">
                        <td className="py-1.5">{label}</td>
                        <td className="py-1.5 text-right">
                          <span className="rounded bg-white px-1.5 py-0.5">
                            {status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pane4 */}
              <div className="bg-white p-3">
                <p className="mb-2 font-semibold">Pane4 · MOQ</p>
                <p className="text-muted-foreground">重要条件バー（常時表示）</p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <Chip label="MOQ" value="500pcs" tone="warn" />
                  <Chip label="独占" value="未確定" tone="muted" />
                </div>
                <p className="mt-3 font-semibold">トーク抜粋（日本語）</p>
                <div className="mt-1 rounded border border-border bg-muted/30 p-2 text-[10px]">
                  初回注文のMOQは500個で提示されました。日本国内の独占については引き続き確認中です。
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              上部 <strong>DealSummaryBar</strong>：MOQ・ゼロMOQ・独占権など重要条件を常時表示
            </li>
            <li>
              左 <strong>作業台</strong>：トーク受信箱 → 解析 → 未決事項 → 返信アシスト
            </li>
            <li>
              中央 <strong>交渉表</strong>：メーカー共通5項目 + 案件5項目の進捗
            </li>
            <li>
              右 <strong>Pane4</strong>：選択項目の詳細・日本語抜粋・確定値
            </li>
          </ul>
        </Section>

        {/* 2. 保持データ */}
        <Section title="2. 保持できるようにしたデータ" id="data">
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="border-b border-border px-4 py-3 font-semibold">
                    カテゴリ
                  </th>
                  <th className="border-b border-border px-4 py-3 font-semibold">
                    保存内容
                  </th>
                  <th className="border-b border-border px-4 py-3 font-semibold">
                    用途
                  </th>
                </tr>
              </thead>
              <tbody>
                {DATA_ROWS.map((row) => (
                  <tr key={row.category} className="border-b border-border/60">
                    <td className="px-4 py-3 align-top font-medium">
                      {row.category}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {row.fields}
                    </td>
                    <td className="px-4 py-3 align-top">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            編集のたびに 700ms デバウンスで自動保存。ヘッダーに「保存済み」を表示。
          </p>
        </Section>

        {/* 3. 保存先 */}
        <Section title="3. 保存先と選定理由" id="storage">
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge>Neon PostgreSQL</Badge>
              <span className="text-muted-foreground">via</span>
              <Badge>Vercel Storage 連携</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge>DATABASE_URL</Badge>
            </div>

            <div className="mt-6 rounded-lg bg-[#1e1e1e] p-4 font-mono text-xs text-green-300">
              <pre>{`Browser ──GET/PUT──▶ /api/workspace-state ──▶ Neon (PostgreSQL)
                                              │
                                              └─ workspace_state テーブル
                                                   deals / manufacturers / regions (JSONB)`}</pre>
            </div>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {REASONS.map((item) => (
                <div key={item.title} className="rounded-lg bg-muted/30 p-4">
                  <dt className="font-semibold">{item.title}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        {/* 4. 工夫・苦戦 */}
        <Section title="4. 工夫したポイント" id="good">
          <div className="grid gap-4 md:grid-cols-2">
            {GOOD_POINTS.map((point) => (
              <article
                key={point.title}
                className="rounded-xl border border-teal-200 bg-teal-50/40 p-4"
              >
                <h3 className="font-semibold text-[#1a4547]">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="5. 苦戦したポイント" id="hard">
          <div className="grid gap-4 md:grid-cols-2">
            {HARD_POINTS.map((point) => (
              <article
                key={point.title}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <h3 className="font-semibold text-amber-900">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </article>
            ))}
          </div>
        </Section>

        {/* 追加情報 */}
        <Section title="6. 技術スタック（補足）" id="stack">
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            <li className="rounded-lg border border-border bg-white px-4 py-3">
              <strong>Frontend</strong>：Next.js 16 / React 19 / Tailwind CSS v4
            </li>
            <li className="rounded-lg border border-border bg-white px-4 py-3">
              <strong>DB</strong>：Neon Serverless Postgres（JSONB 1行保存）
            </li>
            <li className="rounded-lg border border-border bg-white px-4 py-3">
              <strong>AI</strong>：OpenAI API（返信アシスト・英語抜粋の日本語化）
            </li>
            <li className="rounded-lg border border-border bg-white px-4 py-3">
              <strong>Host</strong>：Vercel（GitHub push で自動デプロイ）
            </li>
          </ul>
        </Section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <Link href={APP_URL} className="text-[#1a4547] underline underline-offset-2">
            アプリを開く
          </Link>
          <span className="mx-2">·</span>
          <span>Trade Base Japan — 第8講義課題</span>
        </footer>
      </main>
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-6">
      <h2 className="mb-4 border-b border-[#1a4547]/20 pb-2 text-lg font-bold text-[#1a4547]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "muted";
}) {
  const toneClass =
    tone === "ok"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-border bg-muted/40 text-muted-foreground";

  return (
    <div className={`rounded border px-2 py-1 ${toneClass}`}>
      <span className="block text-[9px] opacity-70">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

const DATA_ROWS = [
  {
    category: "案件（Deal）",
    fields:
      "商品名・ステージ・交渉トピック（status / memo / chatExcerpt / updatedAt）・確定値（MOQ / 独占 / 認証）・トーク受信箱・添付ファイル",
    purpose: "1商品ごとの交渉進捗と根拠テキスト",
  },
  {
    category: "メーカー（Manufacturer）",
    fields:
      "国・連絡手段・共通トピック5項目（ビジネスモデル / クラファン / 4ステップ / 費用負担 / プレマーケ）",
    purpose: "メーカー単位の説明・合意状況",
  },
  {
    category: "地域・選択状態",
    fields: "regions 階層・selectedManufacturerId / selectedDealId",
    purpose: "再起動後も最後に開いていた案件を復元",
  },
];

const REASONS = [
  {
    title: "Vercel と相性が良い",
    body: "Vercel Storage から Neon を接続すると DATABASE_URL が自動設定され、サーバーレス API Route からそのまま使える。",
  },
  {
    title: "JSONB で柔軟に保存",
    body: "交渉トピックや受信箱は構造が変わりやすい。PostgreSQL の JSONB ならスキーマ変更なしで案件データ全体を1行に保持できる。",
  },
  {
    title: "無料枠で課題規模に十分",
    body: "個人の交渉管理ツール規模なら Neon の無料プランで運用可能。",
  },
  {
    title: "永続化が必須だった",
    body: "トーク貼付・反映・確定値はブラウザを閉じても残る必要がある。localStorage だけでは端末依存になるため DB 化した。",
  },
];

const GOOD_POINTS = [
  {
    title: "受信箱中心のフロー",
    body: "WeChat / LINE / メールを貼る → キーワード解析で未決事項を拾う → 交渉表に反映、という一連の流れを左ペインに集約。",
  },
  {
    title: "重要条件バーを常時表示",
    body: "MOQ・ゼロMOQ・独占権・認証など、交渉で必ず見る条件を上部に固定。表をスクロールしても見失わない。",
  },
  {
    title: "英語トークの日本語化",
    body: "Pane4 の抜粋は OpenAI で自動翻訳。WeChat 形式（日時＋英語混在）にも対応。",
  },
  {
    title: "コンソール風3ペイン",
    body: "作業台・交渉表・詳細の役割分担で、情報の散在を減らした。",
  },
];

const HARD_POINTS = [
  {
    title: "Vercel 環境変数のキー名",
    body: "OPENAI_API_KEY のアンダースコアを省略すると翻訳 API が動かない。エラーメッセージから原因特定に時間がかかった。",
  },
  {
    title: "翻訳結果が画面に反映されない",
    body: "InlineTextareaField が defaultValue 固定のため、翻訳成功後も英語のまま表示され続けた。key で再マウントして解決。",
  },
  {
    title: "情報設計の迷子",
    body: "初期はカードが多く散らばっていた。グリル（要件詰め）で「受信箱中心・Pane4 に集約」を決めて整理。",
  },
  {
    title: "Neon 初回接続",
    body: "Vercel Storage 連携 → workspace_state テーブル作成 → DATABASE_URL 反映まで、デプロイと DB のタイミングを合わせる必要があった。",
  },
];
