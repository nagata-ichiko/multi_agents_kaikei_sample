import type { AccountType } from "./ledger";
import type { JournalEntry } from "./ledger";

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
