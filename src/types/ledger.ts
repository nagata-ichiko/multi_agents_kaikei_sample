export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type Account = {
  id: string;
  code: string;        // 科目コード（例: "101"）一意
  name: string;        // 例: 現金
  type: AccountType;
  description: string | null;
  isActive: boolean;
};

export type JournalLine = {
  id: string;
  accountId: string;
  account?: Account;
  debit: number;       // 円・整数。debit/credit はどちらか一方のみ > 0
  credit: number;
  memo: string | null;
  lineOrder: number;
};

export type JournalEntry = {
  id: string;
  entryNumber: number;     // 自動連番
  date: string;            // ISO 8601 (YYYY-MM-DD)
  description: string;
  status: "DRAFT" | "POSTED";
  partnerId: string | null;
  fiscalPeriodId: string;
  lines: JournalLine[];
};

// POST/PATCH リクエストボディ
export type JournalEntryInput = {
  date: string;
  description: string;
  status?: "DRAFT" | "POSTED";
  partnerId?: string | null;
  lines: { accountId: string; debit: number; credit: number; memo?: string }[];
};
