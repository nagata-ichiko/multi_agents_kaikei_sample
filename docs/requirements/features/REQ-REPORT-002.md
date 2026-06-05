# REQ-REPORT-002 財務諸表（損益計算書・貸借対照表）

<!-- review:pending id=r-20260605-006 -->

## 概要

指定した会計期間の損益計算書（PL）と貸借対照表（BS）を表示する。BSには当期純利益を「繰越利益剰余金（当期）」として純資産に含め、借方合計（資産）と貸方合計（負債+純資産）の一致を確認する。読み取り専用ドメイン（reporting）が担当する。

## 関連 Spec

- [REQ-LEDGER-002](./REQ-LEDGER-002.md): 勘定科目管理（科目区分による分類）
- [REQ-MASTER-002](./REQ-MASTER-002.md): 会計期間設定（期間指定）
- [REQ-REPORT-001](./REQ-REPORT-001.md): 試算表（集計ロジックを共有）

## アクター

- 経理担当者・経営者: 損益計算書・貸借対照表を参照する

## 機能要件

### 損益計算書（P/L）

損益計算書画面（`/reports/income-statement`）で、指定した会計期間の収益・費用・当期純利益を表示する。

- フィルタ: periodId（会計期間ID）
- 集計対象: status=POSTED の仕訳のみ
- 収益セクション（REVENUE 区分科目の発生額）、費用セクション（EXPENSE 区分科目の発生額）
- 当期純利益 = 収益合計 − 費用合計

**受入条件:**

- [ ] 会計期間を指定して損益計算書が表示される（`GET /api/reporting/income-statement`）
- [ ] 収益・費用が科目別に表示される
- [ ] 当期純利益が「収益合計 − 費用合計」として正しく計算される
- [ ] POSTED の仕訳のみ集計される

### 貸借対照表（B/S）

貸借対照表画面（`/reports/balance-sheet`）で、指定日時点の資産・負債・純資産を表示する。

- フィルタ: periodId（会計期間ID）、asOf（指定日時点）
- 集計対象: asOf 時点までの status=POSTED の仕訳（期間累計）
- 資産セクション（ASSET 区分）、負債セクション（LIABILITY 区分）、純資産セクション（EQUITY 区分 + 当期純利益）
- 当期純利益を「繰越利益剰余金（当期）」行として純資産セクションに含める
- balanced: 資産合計 === 負債合計 + 純資産合計

**受入条件:**

- [ ] 会計期間を指定して貸借対照表が表示される（`GET /api/reporting/balance-sheet`）
- [ ] 資産・負債・純資産（当期純利益含む）が科目別に表示される
- [ ] 資産合計と（負債合計 + 純資産合計）が一致する（balanced=true）
- [ ] POSTED の仕訳のみ累計集計される

## 画面

| パス | 主要UI要素 |
|------|----------|
| `/reports/income-statement` | 期間選択フィルタ、収益セクション（科目別金額・小計）、費用セクション（科目別金額・小計）、当期純利益 |
| `/reports/balance-sheet` | 期間・asOf選択フィルタ、資産セクション（科目別金額・合計）、負債セクション（科目別金額・合計）、純資産セクション（科目別金額+当期純利益・合計）、借貸一致確認 |

## API

（出典: `interfaces/reporting_interface.md`）

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/reporting/income-statement | 損益計算書（?periodId=） |
| GET | /api/reporting/balance-sheet | 貸借対照表（?periodId=&asOf=） |

**レスポンス型（抜粋）:**

```typescript
// interfaces/reporting_interface.md より
type IncomeStatement = {
  revenues: StatementSection;
  expenses: StatementSection;
  netIncome: number;   // 当期純利益（revenues.total - expenses.total）
};

type BalanceSheet = {
  assets: StatementSection;
  liabilities: StatementSection;
  equity: StatementSection;  // 当期純利益を「繰越利益剰余金（当期）」行として含める
  balanced: boolean;         // assets.total === liabilities.total + equity.total
};
```

## ビジネスルール

（出典: `interfaces/reporting_interface.md`）

- 集計対象は status=POSTED の仕訳のみ（DRAFT は除外）
- PL は期間内発生額、BS は asOf 時点までの期間累計
- 残高計算: ASSET/EXPENSE は借方残（Σdebit−Σcredit）、LIABILITY/EQUITY/REVENUE は貸方残（Σcredit−Σdebit）
- BS の当期純利益は「繰越利益剰余金（当期）」行として純資産セクションに含める
- BS の balanced = (assets.total === liabilities.total + equity.total)

## 受入条件（機能全体）

- [ ] 損益計算書が正しく表示され、当期純利益が正確に計算される
- [ ] 貸借対照表で資産合計と負債+純資産合計が一致する（balanced=true）
- [ ] 当期純利益が BS の純資産セクションに含まれている

## 関連設計書

- API仕様: [design/api-spec.md](../../design/api-spec.md)
- DB設計: [design/db-design.md](../../design/db-design.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2026-06-05 | 初版作成 |

<!-- /review -->
