# REQ-REPORT-001 試算表

<!-- review:pending id=r-20260605-005 -->

## 概要

全勘定科目の借方合計・貸方合計・借方残高・貸方残高を集計した合計残高試算表を表示する。貸借合計の一致を画面上で確認できる。読み取り専用ドメイン（reporting）が担当する。

## 関連 Spec

- [REQ-LEDGER-002](./REQ-LEDGER-002.md): 勘定科目管理（科目マスタ）
- [REQ-MASTER-002](./REQ-MASTER-002.md): 会計期間設定（期間指定）

## アクター

- 経理担当者: 試算表を参照する

## 機能要件

### 合計残高試算表の表示

試算表画面（`/reports/trial-balance`）で、指定した会計期間の合計残高試算表を表示する。

- フィルタ: periodId（会計期間ID）または from/to（日付範囲）
- 集計対象: status=POSTED の仕訳のみ
- 表示項目: 科目コード・科目名・科目区分・借方合計・貸方合計・借方残高・貸方残高
- 貸借合計一致の確認: 借方合計と貸方合計の合計値を表示し、一致することを示す

**受入条件:**

- [ ] 会計期間または日付範囲を指定して試算表が表示される（`GET /api/reporting/trial-balance`）
- [ ] POSTED の仕訳のみ集計される（DRAFT は除外）
- [ ] 各科目の借方合計・貸方合計・借方残高・貸方残高が正しく表示される
- [ ] 画面下部に借方合計計・貸方合計計が表示され、一致することが確認できる

## 画面

| パス | 主要UI要素 |
|------|----------|
| `/reports/trial-balance` | 期間選択フィルタ、試算表テーブル（科目コード・科目名・区分・借方合計・貸方合計・借方残高・貸方残高）、合計行（借方合計計・貸方合計計） |

## API

（出典: `interfaces/reporting_interface.md`）

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/reporting/trial-balance | 合計残高試算表（?periodId= または ?from=&to=） |

**レスポンス型（抜粋）:**

```typescript
// interfaces/reporting_interface.md より
type TrialBalanceRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitTotal: number;     // 借方合計
  creditTotal: number;    // 貸方合計
  debitBalance: number;   // 借方残高（正の場合のみ、それ以外 0）
  creditBalance: number;
};

type TrialBalance = {
  rows: TrialBalanceRow[];
  totals: { debit: number; credit: number };
};
```

## ビジネスルール

（出典: `interfaces/reporting_interface.md`）

- 集計対象は status=POSTED の仕訳のみ（DRAFT は除外）
- 残高計算: ASSET/EXPENSE は借方残（Σdebit−Σcredit）、LIABILITY/EQUITY/REVENUE は貸方残（Σcredit−Σdebit）
- 貸借合計は totals.debit === totals.credit となるはず（複式簿記の原則）

## 受入条件（機能全体）

- [ ] 会計期間を選択して試算表が正しく表示される
- [ ] 借方合計計と貸方合計計が一致している
- [ ] DRAFT の仕訳は集計に含まれない

## 関連設計書

- API仕様: [design/api-spec.md](../../design/api-spec.md)
- DB設計: [design/db-design.md](../../design/db-design.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2026-06-05 | 初版作成 |

<!-- /review -->
