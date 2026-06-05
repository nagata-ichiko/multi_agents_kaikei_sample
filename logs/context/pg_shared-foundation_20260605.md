# 共通基盤の実装（フェーズ1）

## タスク概要
- 対象REQ-ID: 共通基盤（全REQの前提）
- 変更種別: 新規実装
- 概要: Next.js 15 プロジェクトの scaffold、PostgreSQL(Docker)、Prisma スキーマ＋マイグレーション＋シード、共通UIコンポーネント、アプリシェル（サイドバー/ヘッダー）を構築する

## タスク依存関係
- blocks: フェーズ2の全機能タスク（ledger / reporting / master）
- blockedBy: なし

## 必須ドキュメント参照
- interfaces/ledger_interface.md / interfaces/reporting_interface.md / interfaces/master_interface.md（型・ビジネスルールの正）
- logs/context/superpm_plan_20260605.md（画面一覧・技術スタック）

## 実装内容

### 1. プロジェクト scaffold（リポジトリルートに配置）
- Next.js 15 + TypeScript + App Router + src ディレクトリ + Tailwind CSS v4 + ESLint
- 既存ファイル（docs/, .claude/, mkdocs.yml 等）を壊さないこと。`create-next-app` を一時ディレクトリで実行してから必要ファイルだけルートへ移す方法を推奨
- 追加パッケージ: prisma @prisma/client zod recharts、devDependencies: vitest @vitejs/plugin-react tsx
- package.json scripts: dev / build / start / lint / test(vitest run) / db:up(docker compose up -d) / db:migrate / db:seed
- .gitignore に node_modules, .next, .env を追記（既存内容は保持）
- .env.example と .env を作成: DATABASE_URL="postgresql://kaikei:kaikei@localhost:5433/kaikei?schema=public"

### 2. docker-compose.yml（ルート）
- postgres:16-alpine、コンテナ名 kaikei-db、ホストポート 5433→5432
- POSTGRES_USER=kaikei / POSTGRES_PASSWORD=kaikei / POSTGRES_DB=kaikei
- volume で永続化、healthcheck 付き

### 3. prisma/schema.prisma（以下を一字一句レベルで正とする）
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum PartnerType {
  CUSTOMER
  VENDOR
  BOTH
}

enum EntryStatus {
  DRAFT
  POSTED
}

model Account {
  id          String        @id @default(cuid())
  code        String        @unique
  name        String
  type        AccountType
  description String?
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  lines       JournalLine[]
}

model Partner {
  id        String         @id @default(cuid())
  code      String         @unique
  name      String
  kana      String?
  type      PartnerType
  email     String?
  phone     String?
  address   String?
  note      String?
  isActive  Boolean        @default(true)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  entries   JournalEntry[]
}

model FiscalPeriod {
  id        String         @id @default(cuid())
  name      String
  startDate DateTime       @db.Date
  endDate   DateTime       @db.Date
  isClosed  Boolean        @default(false)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  entries   JournalEntry[]
}

model JournalEntry {
  id             String        @id @default(cuid())
  entryNumber    Int           @unique @default(autoincrement())
  date           DateTime      @db.Date
  description    String
  status         EntryStatus   @default(POSTED)
  partnerId      String?
  partner        Partner?      @relation(fields: [partnerId], references: [id])
  fiscalPeriodId String
  fiscalPeriod   FiscalPeriod  @relation(fields: [fiscalPeriodId], references: [id])
  lines          JournalLine[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([date])
  @@index([fiscalPeriodId])
}

model JournalLine {
  id        String       @id @default(cuid())
  entryId   String
  entry     JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  accountId String
  account   Account      @relation(fields: [accountId], references: [id])
  debit     Decimal      @default(0) @db.Decimal(14, 0)
  credit    Decimal      @default(0) @db.Decimal(14, 0)
  memo      String?
  lineOrder Int          @default(0)

  @@index([accountId])
  @@index([entryId])
}
```
- `prisma migrate dev --name init` でマイグレーション作成（DB起動後）

### 4. prisma/seed.ts（tsx で実行）
- 勘定科目: 日本の標準的な科目を30個程度。コード体系: 100番台=資産(現金101, 普通預金102, 売掛金103, 商品104, 仮払金105, 工具器具備品106 等)、200番台=負債(買掛金201, 未払金202, 預り金203, 借入金204 等)、300番台=純資産(資本金301, 繰越利益剰余金302)、400番台=収益(売上高401, 受取利息402, 雑収入403)、500番台=費用(仕入高501, 給料手当502, 法定福利費503, 地代家賃504, 水道光熱費505, 通信費506, 消耗品費507, 旅費交通費508, 広告宣伝費509, 会議費510, 接待交際費511, 支払手数料512, 減価償却費513, 雑費514)
- 会計期間: 2025年度(2025-04-01〜2026-03-31, isClosed=true)・2026年度(2026-04-01〜2027-03-31, isClosed=false)
- 取引先: 株式会社サンプル商事(CUSTOMER)、合同会社テックパートナーズ(CUSTOMER)、株式会社オフィスサプライ(VENDOR)、ABCリース株式会社(VENDOR)、株式会社グローバル商会(BOTH) の5件
- 仕訳: 2026年度の 2026-04-01〜2026-06-05 に40件程度 + 2025年度に数件。期首仕訳（現金/普通預金/資本金）、売上（売掛金/売上高 → 普通預金/売掛金 の回収）、仕入、給料、家賃、光熱費、通信費等をバランスよく。**全仕訳で貸借一致を厳守**。ダッシュボードの月次グラフが映えるように月ごとに金額を変える
- upsert ベースで冪等にする

### 5. 共通ライブラリ
- src/lib/prisma.ts: PrismaClient シングルトン（globalThis パターン）
- src/lib/format.ts: formatCurrency(number→"¥1,234,567")、formatDate(Date|string→"2026/04/01")、parseYmd
- src/lib/api-helpers.ts: Route Handler 用 jsonOk / jsonError(status, message, details?)、ZodError→422 変換 handleApiError(e)
- src/lib/client-fetch.ts: クライアント用 apiFetch<T>(url, options)（エラー時に message を throw）
- src/types/ledger.ts / src/types/master.ts / src/types/reporting.ts: interfaces/*.md の型定義をそのまま実装

### 6. 共通UIコンポーネント（src/components/ui/）
全て TypeScript + Tailwind。デザイントーン: 白基調カード + ダークネイビーのサイドバー、アクセント indigo-600、角丸 rounded-xl、影 shadow-sm。
- Button.tsx（variant: primary/secondary/danger/ghost、size: sm/md、loading 対応）
- Input.tsx / Select.tsx / Textarea.tsx（label・error 表示付き）
- Card.tsx（title/action 付きセクションカード）
- Table.tsx（汎用: columns 定義 + rows。右寄せ数値列対応）
- Modal.tsx（開閉・タイトル・フッター）
- Badge.tsx（色 variant: gray/green/red/blue/amber）
- PageHeader.tsx（タイトル + 説明 + 右側アクション）
- EmptyState.tsx（アイコン + メッセージ + アクション）
- Toast.tsx + ToastProvider（成功/エラー通知、useToast フック）
- ConfirmDialog.tsx（削除確認用）
- Pagination.tsx

### 7. アプリシェル
- src/app/layout.tsx: html lang="ja"、メタデータ「会計サンプル | Kaikei」、ToastProvider
- src/components/layout/Sidebar.tsx: ダークネイビー（bg-slate-900）固定サイドバー。ナビゲーション（superpm_plan の画面一覧の通り、セクション分け: ダッシュボード / 仕訳[仕訳一覧・仕訳入力] / 帳簿[仕訳帳・総勘定元帳・勘定科目] / レポート[試算表・損益計算書・貸借対照表] / マスタ[取引先・会計期間]）。usePathname でアクティブ表示。アイコンはインラインSVG
- src/components/layout/Header.tsx: ページ上部バー（パンくず or アプリ名 + 会計期間表示）
- src/app/(app)/layout.tsx: Sidebar + main コンテンツ枠
- src/app/(app)/page.tsx: 仮ダッシュボード（「フェーズ2で実装」プレースホルダ。reporting が後で置き換える）
- 他の11画面のプレースホルダページは**作らない**（各ドメインが作る。ルート衝突防止）

### 8. vitest 設定
- vitest.config.ts（node 環境、src/**/*.test.ts）
- サンプルテスト: src/lib/format.test.ts

### 9. docs/design/shared-components.md の作成
実装した全共通コンポーネント・ユーティリティの props/シグネチャ・使用例を記録する。フェーズ2の全PGがこれを参照する。

## 完了条件
- [ ] docker compose up -d → prisma migrate dev → seed が成功
- [ ] `npm run build` が成功
- [ ] `npm run test` が成功
- [ ] `npm run dev` でサイドバー付きシェルが表示される（手元で起動→curl で 200 確認→停止）
- [ ] docs/design/shared-components.md 作成済み

## 禁止事項
- 個別機能（仕訳入力・レポート等）の実装（プレースホルダ含む）
- docs/requirements/, docs/design/（shared-components.md 以外）, mkdocs.yml の変更
- 既存の docs/, .claude/, ci-templates/ 等の削除・変更
- git commit（SuperPM がレビュー後に行う）
