# REQ-REPORT-003 ダッシュボード

## 概要

経営状況を一目で把握できるダッシュボードを提供する。KPIカード（売上・費用・当期純利益・現金残高・仕訳件数）、月次推移グラフ（期首から12ヶ月）、費用内訳グラフ（上位7科目+その他）、直近5件の仕訳を表示する。読み取り専用ドメイン（reporting）が担当する。

## 関連 Spec

- [REQ-LEDGER-001](./REQ-LEDGER-001.md): 仕訳入力（直近仕訳の参照元）
- [REQ-MASTER-002](./REQ-MASTER-002.md): 会計期間設定（期間指定）
- [REQ-REPORT-002](./REQ-REPORT-002.md): 財務諸表（集計ロジックを共有）

## アクター

- 経理担当者・経営者: ダッシュボードで経営状況を確認する

## 機能要件

### KPIカード

会計期間を選択してKPIカードを表示する。

- 表示項目: 売上（revenue）、費用（expense）、当期純利益（netIncome）、現金残高（cashBalance）、仕訳件数（entryCount）
- 集計対象: status=POSTED の仕訳のみ

**受入条件:**

- [ ] 会計期間を選択してKPIカードが表示される
- [ ] 売上・費用・当期純利益・現金残高・仕訳件数が正しく表示される

### 月次推移グラフ

期首から12ヶ月分の月次売上・費用・当期純利益の推移を折れ線グラフまたは棒グラフで表示する。

- データ: monthlyTrend（month・revenue・expense・netIncome の配列）
- グラフライブラリ: recharts

**受入条件:**

- [ ] 月次推移グラフが表示される
- [ ] 各月の売上・費用・当期純利益が視覚的に確認できる

### 費用内訳グラフ

費用科目の内訳を円グラフで表示する。

- 上位7科目+その他の8カテゴリで表示する
- データ: expenseBreakdown（accountName・amount の配列）

**受入条件:**

- [ ] 費用内訳グラフが表示される
- [ ] 上位7科目以外は「その他」にまとめられる

### 直近仕訳

直近5件のPOSTED仕訳を一覧表示する。

- データ: recentEntries（JournalEntry の配列）
- 表示項目: 日付、摘要、金額（借方合計）、ステータス

**受入条件:**

- [ ] 直近5件の仕訳が表示される
- [ ] DRAFT の仕訳は含まれない

## 画面

| パス | 主要UI要素 |
|------|----------|
| `/` | 期間選択、KPIカード（5種）、月次推移グラフ（recharts）、費用内訳円グラフ（recharts）、直近仕訳テーブル（5件） |

## API

（出典: `interfaces/reporting_interface.md`）

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/reporting/dashboard | ダッシュボード集計（?periodId=） |

**レスポンス型（抜粋）:**

```typescript
// interfaces/reporting_interface.md より
type DashboardData = {
  kpi: {
    revenue: number;
    expense: number;
    netIncome: number;
    cashBalance: number;
    entryCount: number;
  };
  monthlyTrend: {
    month: string;
    revenue: number;
    expense: number;
    netIncome: number;
  }[];  // 期首から12ヶ月
  expenseBreakdown: {
    accountName: string;
    amount: number;
  }[];  // 費用上位7科目+その他
  recentEntries: JournalEntry[];  // 直近5件
};
```

## ビジネスルール

（出典: `interfaces/reporting_interface.md`）

- 集計対象は status=POSTED の仕訳のみ（DRAFT は除外）
- monthlyTrend は期首から12ヶ月分
- expenseBreakdown は費用科目上位7件 + その他（8番目以降を合算）
- recentEntries は直近5件（POSTED のみ）

## 受入条件（機能全体）

- [ ] ダッシュボードに全KPIカード・グラフ・直近仕訳が表示される
- [ ] 会計期間を切り替えると数値が変わる
- [ ] DRAFT 仕訳は全集計から除外される

## 関連設計書

- API仕様: [design/api-spec.md](../../design/api-spec.md)
- DB設計: [design/db-design.md](../../design/db-design.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2026-06-05 | 初版作成 |
