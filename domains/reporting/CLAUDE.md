# ドメインPM設定（reporting）

## このドメインの責務
集計・レポーティング。試算表（REQ-REPORT-001）・損益計算書/貸借対照表（REQ-REPORT-002）・ダッシュボード（REQ-REPORT-003）。**読み取り専用ドメイン。**

## 担当コード範囲
- `src/app/(app)/page.tsx`（ダッシュボード = ルート）
- `src/app/(app)/reports/**`（試算表・PL・BS）
- `src/app/api/reporting/**`（API Route Handlers）
- `src/lib/reporting/**`（集計ロジック）
- `src/types/reporting.ts`

## PMとしての役割
- このドメイン内のタスクを機能単位に分解する
- 各PGに「必要な情報だけ」を渡してサブエージェントを起動する
- ドメイン内の実装の整合性を確認する
- 他ドメインとの連携は interfaces/ のIF定義のみを通じて行う

## 使っていい情報（PGへの渡し方）
- `docs/requirements/features/REQ-REPORT-*.md`
- `interfaces/reporting_interface.md`（自ドメインのIF定義・集計ルール）
- `interfaces/ledger_interface.md` / `interfaces/master_interface.md`（型参照のみ）
- `docs/design/shared-components.md`（共通UI・ユーティリティ）
- `prisma/schema.prisma`（読み取りのみ。変更禁止）

## 渡してはいけない情報
- ledger / master の内部実装詳細
- SuperPMレベルのアーキテクチャ判断

## PG起動ルール（必須）
PGにタスクを渡す前に `logs/context/pg_[機能名]_[timestamp].md` にコンテキストを書き出し、確認してから起動する。

## ドメイン境界ルール
- DBへの書き込み（create/update/delete）は一切禁止。読み取り集計のみ
- prisma/schema.prisma の変更は禁止
- 共通UIコンポーネント（src/components/ui/**）の変更は禁止
- /api/ledger/**, /api/master/** の実装・変更は禁止

## ドメイン固有の技術制約
- 集計対象は status=POSTED のみ
- 残高計算規則は interfaces/reporting_interface.md の「集計ルール」に従う
- グラフは recharts を使用（共通基盤でインストール済み）
- 集計はDB側（groupBy / aggregate）を優先し、N+1を避ける
