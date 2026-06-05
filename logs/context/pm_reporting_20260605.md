# reporting ドメイン実装タスク（フェーズ2）

## タスク概要
- 対象REQ-ID: REQ-REPORT-001（試算表）, REQ-REPORT-002（損益計算書・貸借対照表）, REQ-REPORT-003（ダッシュボード）
- 変更種別: 新規実装
- 概要: 読み取り専用の集計ドメイン。API（/api/reporting/**）と画面4つ（/ ダッシュボード、/reports/trial-balance、/reports/income-statement、/reports/balance-sheet）を実装する

## タスク依存関係
- blocks: フェーズ3統合
- blockedBy: なし（共通基盤はmainにマージ済み。シードデータ投入済みなので実データで動作確認可能）

## 必須ドキュメント参照
- ドメインPM設定: domains/reporting/CLAUDE.md（担当コード範囲・禁止事項）
- 要件定義書: docs/requirements/features/REQ-REPORT-001.md / REQ-REPORT-002.md / REQ-REPORT-003.md
- IF定義（API/型/集計ルールの正）: interfaces/reporting_interface.md
- 依存IF: interfaces/ledger_interface.md / interfaces/master_interface.md（型のみ）
- 共通コンポーネント: docs/design/shared-components.md（必読。再発明禁止）
- 画面遷移: docs/design/screen-flow.md
- DBスキーマ: prisma/schema.prisma（変更禁止・読み取りのみ）

## 実装ガイド
- API: src/app/api/reporting/trial-balance/route.ts, income-statement/route.ts, balance-sheet/route.ts, dashboard/route.ts
- 集計ロジック: src/lib/reporting/（試算表集計、残高計算規則、月次推移、費用内訳）。Prisma groupBy/aggregate を優先し N+1 回避
- ダッシュボード（/ = src/app/(app)/page.tsx を置き換え）: KPIカード4枚以上（収益・費用・当期純利益・現金預金残高）、月次推移グラフ（recharts AreaChart or BarChart、収益/費用/利益）、費用内訳（DonutまたはPie、上位7科目+その他）、直近仕訳5件テーブル。会計期間セレクタ
- 試算表: 借方合計/貸方合計/借方残高/貸方残高の4列+合計行（貸借一致をBadge表示）。科目クリックで総勘定元帳へリンク
- PL: 収益セクション・費用セクション・当期純利益（赤字は赤表示）
- BS: 資産/負債/純資産の3セクション、純資産に「当期純利益」行を含め借貸一致を検証表示
- 集計対象は status=POSTED のみ。残高規則: ASSET/EXPENSE=借方残、LIABILITY/EQUITY/REVENUE=貸方残
- テスト: 残高計算・試算表集計・PL/BS整合のユニットテスト（Vitest、src/lib/reporting/*.test.ts）

## 完了条件
- [ ] 全API実装（IF定義通りのレスポンス型）
- [ ] 全4画面実装（レスポンシブ、共通UIコンポーネント+recharts）
- [ ] ユニットテスト追加・全テスト通過（npm run test）
- [ ] npm run build 成功
- [ ] spec-map.yml の REQ-REPORT-001/002/003 に implementation/tests を記入（confirmed: 1）

## 禁止事項
- DBへの書き込み（create/update/delete）
- prisma/schema.prisma の変更
- src/components/ui/**, src/lib/(format|prisma|api-helpers|client-fetch).ts, src/components/layout/** の変更
- /api/ledger/**, /api/master/** および他ドメイン画面の実装
- docs/（要件定義・設計書）の変更
- git commit（SuperPMが行う）
