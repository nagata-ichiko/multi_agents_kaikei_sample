# reporting サービス インターフェース

## バージョン
| 項目 | 値 |
|------|-----|
| IF バージョン | 1 |
| 最終更新 | 2026-06-05 |
| 担当ドメイン | reporting |

## 責務
仕訳データの集計・レポーティング（試算表・損益計算書・貸借対照表・ダッシュボード）。**読み取り専用ドメイン**（DBへの書き込みは行わない）。

## 提供するエンドポイント
| メソッド | パス | 概要 | 対応Spec |
|---------|------|------|---------|
| GET | /api/reporting/trial-balance | 合計残高試算表（?periodId= または ?from=&to=） | REQ-REPORT-001 |
| GET | /api/reporting/income-statement | 損益計算書（?periodId=） | REQ-REPORT-002 |
| GET | /api/reporting/balance-sheet | 貸借対照表（?periodId=&asOf=） | REQ-REPORT-002 |
| GET | /api/reporting/dashboard | ダッシュボード集計（?periodId=） | REQ-REPORT-003 |

## 提供する型定義
```typescript
// src/types/reporting.ts に配置
export type TrialBalanceRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;        // ledger の型を再利用
  debitTotal: number;              // 借方合計
  creditTotal: number;             // 貸方合計
  debitBalance: number;            // 借方残高（正の場合のみ、それ以外 0）
  creditBalance: number;
};

export type TrialBalance = { rows: TrialBalanceRow[]; totals: { debit: number; credit: number } };

export type StatementSection = {
  label: string;                   // 例: 売上高 / 販売費及び一般管理費 / 流動資産
  rows: { accountId: string; accountCode: string; accountName: string; amount: number }[];
  total: number;
};

export type IncomeStatement = {
  revenues: StatementSection;
  expenses: StatementSection;
  netIncome: number;               // 当期純利益（revenues.total - expenses.total）
};

export type BalanceSheet = {
  assets: StatementSection;
  liabilities: StatementSection;
  equity: StatementSection;        // 当期純利益を「繰越利益剰余金（当期）」行として含める
  balanced: boolean;               // assets.total === liabilities.total + equity.total
};

export type DashboardData = {
  kpi: { revenue: number; expense: number; netIncome: number; cashBalance: number; entryCount: number };
  monthlyTrend: { month: string; revenue: number; expense: number; netIncome: number }[]; // 期首から12ヶ月
  expenseBreakdown: { accountName: string; amount: number }[];  // 費用上位（上位7科目+その他）
  recentEntries: JournalEntry[];   // 直近5件（ledger の型を再利用）
};
```

## 集計ルール
- 集計対象は status=POSTED の仕訳のみ（DRAFT は除外）
- 残高計算: ASSET/EXPENSE は借方残（Σdebit−Σcredit）、LIABILITY/EQUITY/REVENUE は貸方残（Σcredit−Σdebit）
- BS は期間累計（asOf 時点まで）、PL は期間内発生額

## DBモデル所有権
なし（ledger / master のモデルを Prisma 経由で**読み取りのみ**）

## 利用する他ドメインのIF
| 依存先ドメイン | 利用するエンドポイント/型 | 用途 |
|-------------|----------------------|------|
| ledger | Account, JournalEntry, JournalLine 型 / DB読み取り | 集計元データ |
| master | FiscalPeriod 型 / DB読み取り | 期間指定 |

## 破壊的変更ルール
- レスポンス型の変更は破壊的変更。IFバージョンを+1する
