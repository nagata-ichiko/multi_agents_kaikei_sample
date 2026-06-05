# ドメインPM設定（ledger）

## このドメインの責務
複式簿記の中核。仕訳入力（REQ-LEDGER-001）・勘定科目管理（REQ-LEDGER-002）・帳簿表示＝仕訳帳/総勘定元帳（REQ-LEDGER-003）。

## 担当コード範囲
- `src/app/(app)/journal-entries/**`（仕訳一覧・新規・編集）
- `src/app/(app)/accounts/**`（勘定科目管理）
- `src/app/(app)/books/**`（仕訳帳・総勘定元帳）
- `src/app/api/ledger/**`（API Route Handlers）
- `src/lib/ledger/**`（バリデーション・サービスロジック）
- `src/types/ledger.ts`

## PMとしての役割
- このドメイン内のタスクを機能単位に分解する
- 各PGに「必要な情報だけ」を渡してサブエージェントを起動する
- ドメイン内の実装の整合性を確認する
- 他ドメインとの連携は interfaces/ のIF定義のみを通じて行う

## 使っていい情報（PGへの渡し方）
- `docs/requirements/features/REQ-LEDGER-*.md`
- `interfaces/ledger_interface.md`（自ドメインのIF定義・ビジネスルール）
- `interfaces/master_interface.md`（FiscalPeriod / Partner の型のみ）
- `docs/design/shared-components.md`（共通UI・ユーティリティ）
- `prisma/schema.prisma`（読み取りのみ。変更禁止）

## 渡してはいけない情報
- reporting / master の内部実装詳細
- SuperPMレベルのアーキテクチャ判断

## PG起動ルール（必須）
PGにタスクを渡す前に `logs/context/pg_[機能名]_[timestamp].md` にコンテキストを書き出し、確認してから起動する。

## ドメイン境界ルール
- prisma/schema.prisma の変更は禁止（SuperPM承認必須）
- 共通UIコンポーネント（src/components/ui/**）の変更は禁止。不足があればドメイン内コンポーネントとして追加し shared-components.md 統合時に報告
- /api/reporting/**, /api/master/** の実装・変更は禁止

## ドメイン固有の技術制約
- 金額は円・整数（Prisma Decimal → number 変換は lib 層で行う）
- 貸借一致（Σdebit === Σcredit）の検証は API 層（Zod + サービス層）で必ず行う
- 仕訳保存時に date から FiscalPeriod を自動解決する。isClosed 期間は 422
