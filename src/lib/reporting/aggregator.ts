/**
 * reporting ドメイン 集計ロジック
 *
 * 集計ルール（interfaces/reporting_interface.md より）:
 * - 集計対象は status=POSTED の仕訳のみ（DRAFT は除外）
 * - 残高計算: ASSET/EXPENSE は借方残（Σdebit−Σcredit）
 *             LIABILITY/EQUITY/REVENUE は貸方残（Σcredit−Σdebit）
 * - BS は期間累計（asOf 時点まで）、PL は期間内発生額
 */

import { prisma } from "@/lib/prisma";
import { EntryStatus, Prisma } from "@prisma/client";
import type {
  TrialBalance,
  TrialBalanceRow,
  IncomeStatement,
  BalanceSheet,
  StatementSection,
  DashboardData,
} from "@/types/reporting";
import type { AccountType } from "@/types/ledger";

// -----------------------------------------------------------------------
// 内部ヘルパー
// -----------------------------------------------------------------------

/** Decimal 型 (Prisma) → number に変換 */
function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  // Prisma Decimal オブジェクト（.toNumber() が使えない環境向け）
  return Number(String(v));
}

/**
 * 残高を計算する
 * ASSET/EXPENSE: 借方残（借方合計 − 貸方合計、負なら0）
 * LIABILITY/EQUITY/REVENUE: 貸方残（貸方合計 − 借方合計、負なら0）
 */
export function calcBalance(
  accountType: AccountType,
  debitTotal: number,
  creditTotal: number
): { debitBalance: number; creditBalance: number } {
  if (accountType === "ASSET" || accountType === "EXPENSE") {
    const bal = debitTotal - creditTotal;
    return { debitBalance: bal > 0 ? bal : 0, creditBalance: bal < 0 ? -bal : 0 };
  } else {
    // LIABILITY / EQUITY / REVENUE
    const bal = creditTotal - debitTotal;
    return { debitBalance: bal < 0 ? -bal : 0, creditBalance: bal > 0 ? bal : 0 };
  }
}

// -----------------------------------------------------------------------
// 試算表（REQ-REPORT-001）
// -----------------------------------------------------------------------

export interface TrialBalanceFilter {
  periodId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

/**
 * 合計残高試算表を計算する
 * Prisma groupBy で1クエリに集約し N+1 を回避する
 */
export async function calcTrialBalance(
  filter: TrialBalanceFilter
): Promise<TrialBalance> {
  // -----------------------------------------------------------------------
  // 1. 仕訳行フィルタ条件を構築
  // -----------------------------------------------------------------------
  const entryWhere: Prisma.JournalEntryWhereInput = { status: EntryStatus.POSTED };
  if (filter.periodId) {
    entryWhere.fiscalPeriodId = filter.periodId;
  } else if (filter.from || filter.to) {
    const dateFilter: Record<string, Date> = {};
    if (filter.from) dateFilter.gte = new Date(filter.from);
    if (filter.to) dateFilter.lte = new Date(filter.to);
    entryWhere.date = dateFilter;
  }

  // -----------------------------------------------------------------------
  // 2. 全勘定科目を取得
  // -----------------------------------------------------------------------
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  // -----------------------------------------------------------------------
  // 3. groupBy で科目ごとの借方合計・貸方合計を1クエリで取得
  // -----------------------------------------------------------------------
  const groups = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      entry: entryWhere,
    },
    _sum: {
      debit: true,
      credit: true,
    },
  });

  const groupMap = new Map(
    groups.map((g) => [
      g.accountId,
      {
        debitTotal: toNum(g._sum?.debit ?? 0),
        creditTotal: toNum(g._sum?.credit ?? 0),
      },
    ])
  );

  // -----------------------------------------------------------------------
  // 4. 試算表行を組み立て
  // -----------------------------------------------------------------------
  const rows: TrialBalanceRow[] = accounts.map((acc) => {
    const { debitTotal, creditTotal } = groupMap.get(acc.id) ?? {
      debitTotal: 0,
      creditTotal: 0,
    };
    const { debitBalance, creditBalance } = calcBalance(
      acc.type as AccountType,
      debitTotal,
      creditTotal
    );
    return {
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      accountType: acc.type as AccountType,
      debitTotal,
      creditTotal,
      debitBalance,
      creditBalance,
    };
  });

  const totals = {
    debit: rows.reduce((s, r) => s + r.debitTotal, 0),
    credit: rows.reduce((s, r) => s + r.creditTotal, 0),
  };

  return { rows, totals };
}

// -----------------------------------------------------------------------
// 損益計算書（REQ-REPORT-002 PL）
// -----------------------------------------------------------------------

/**
 * 損益計算書を計算する（期間内発生額）
 */
export async function calcIncomeStatement(
  periodId: string
): Promise<IncomeStatement> {
  const entryWhere: Prisma.JournalEntryWhereInput = { status: EntryStatus.POSTED, fiscalPeriodId: periodId };

  // REVENUE / EXPENSE 科目をまとめて取得
  const accounts = await prisma.account.findMany({
    where: { isActive: true, type: { in: ["REVENUE", "EXPENSE"] } },
    orderBy: { code: "asc" },
  });

  const groups = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: { entry: entryWhere },
    _sum: { debit: true, credit: true },
  });

  const groupMap = new Map(
    groups.map((g) => [
      g.accountId,
      {
        debitTotal: toNum(g._sum?.debit ?? 0),
        creditTotal: toNum(g._sum?.credit ?? 0),
      },
    ])
  );

  const revenueRows: StatementSection["rows"] = [];
  const expenseRows: StatementSection["rows"] = [];

  for (const acc of accounts) {
    const { debitTotal, creditTotal } = groupMap.get(acc.id) ?? {
      debitTotal: 0,
      creditTotal: 0,
    };
    // REVENUE: 貸方残（creditTotal − debitTotal）
    // EXPENSE: 借方残（debitTotal − creditTotal）
    if (acc.type === "REVENUE") {
      const amount = creditTotal - debitTotal;
      revenueRows.push({ accountId: acc.id, accountCode: acc.code, accountName: acc.name, amount });
    } else {
      const amount = debitTotal - creditTotal;
      expenseRows.push({ accountId: acc.id, accountCode: acc.code, accountName: acc.name, amount });
    }
  }

  const revenueTotal = revenueRows.reduce((s, r) => s + r.amount, 0);
  const expenseTotal = expenseRows.reduce((s, r) => s + r.amount, 0);

  return {
    revenues: { label: "売上高", rows: revenueRows, total: revenueTotal },
    expenses: { label: "販売費及び一般管理費", rows: expenseRows, total: expenseTotal },
    netIncome: revenueTotal - expenseTotal,
  };
}

// -----------------------------------------------------------------------
// 貸借対照表（REQ-REPORT-002 BS）
// -----------------------------------------------------------------------

/**
 * 貸借対照表を計算する（asOf 時点までの期間累計）
 */
export async function calcBalanceSheet(
  periodId: string,
  asOf?: string
): Promise<BalanceSheet> {
  // asOf が指定されていなければ期間の endDate まで集計
  let entryDateWhere: Record<string, Date> | undefined;

  if (asOf) {
    entryDateWhere = { lt: new Date(asOf) };
  } else {
    // 期間の endDate を取得
    const period = await prisma.fiscalPeriod.findUnique({
      where: { id: periodId },
    });
    if (period) {
      entryDateWhere = { lte: period.endDate };
    }
  }

  const entryWhere: Prisma.JournalEntryWhereInput = {
    status: EntryStatus.POSTED,
    fiscalPeriodId: periodId,
  };
  if (entryDateWhere) {
    entryWhere.date = entryDateWhere;
  }

  const accounts = await prisma.account.findMany({
    where: { isActive: true, type: { in: ["ASSET", "LIABILITY", "EQUITY"] } },
    orderBy: { code: "asc" },
  });

  const groups = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: { entry: entryWhere },
    _sum: { debit: true, credit: true },
  });

  const groupMap = new Map(
    groups.map((g) => [
      g.accountId,
      {
        debitTotal: toNum(g._sum?.debit ?? 0),
        creditTotal: toNum(g._sum?.credit ?? 0),
      },
    ])
  );

  // PL の当期純利益（BS の純資産に含める）
  const pl = await calcIncomeStatementByDate(periodId, asOf);
  const netIncome = pl.netIncome;

  const assetRows: StatementSection["rows"] = [];
  const liabilityRows: StatementSection["rows"] = [];
  const equityRows: StatementSection["rows"] = [];

  for (const acc of accounts) {
    const { debitTotal, creditTotal } = groupMap.get(acc.id) ?? {
      debitTotal: 0,
      creditTotal: 0,
    };

    if (acc.type === "ASSET") {
      const amount = debitTotal - creditTotal;
      assetRows.push({ accountId: acc.id, accountCode: acc.code, accountName: acc.name, amount });
    } else if (acc.type === "LIABILITY") {
      const amount = creditTotal - debitTotal;
      liabilityRows.push({ accountId: acc.id, accountCode: acc.code, accountName: acc.name, amount });
    } else {
      // EQUITY
      const amount = creditTotal - debitTotal;
      equityRows.push({ accountId: acc.id, accountCode: acc.code, accountName: acc.name, amount });
    }
  }

  // 当期純利益を「繰越利益剰余金（当期）」として純資産セクションに追加
  equityRows.push({
    accountId: "net-income",
    accountCode: "",
    accountName: "繰越利益剰余金（当期）",
    amount: netIncome,
  });

  const assetTotal = assetRows.reduce((s, r) => s + r.amount, 0);
  const liabilityTotal = liabilityRows.reduce((s, r) => s + r.amount, 0);
  const equityTotal = equityRows.reduce((s, r) => s + r.amount, 0);

  return {
    assets: { label: "資産", rows: assetRows, total: assetTotal },
    liabilities: { label: "負債", rows: liabilityRows, total: liabilityTotal },
    equity: { label: "純資産", rows: equityRows, total: equityTotal },
    balanced: Math.abs(assetTotal - (liabilityTotal + equityTotal)) < 1,
  };
}

/**
 * 指定日以前の PL を計算する（BS の純資産計算用）
 */
async function calcIncomeStatementByDate(
  periodId: string,
  asOf?: string
): Promise<{ netIncome: number }> {
  const entryWhere: Prisma.JournalEntryWhereInput = {
    status: EntryStatus.POSTED,
    fiscalPeriodId: periodId,
  };
  if (asOf) {
    entryWhere.date = { lte: new Date(asOf) };
  }

  const groups = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      entry: entryWhere,
      account: { type: { in: ["REVENUE", "EXPENSE"] } },
    },
    _sum: { debit: true, credit: true },
  });

  const accounts = await prisma.account.findMany({
    where: { isActive: true, type: { in: ["REVENUE", "EXPENSE"] } },
    select: { id: true, type: true },
  });
  const accTypeMap = new Map(accounts.map((a) => [a.id, a.type]));

  let revenue = 0;
  let expense = 0;

  for (const g of groups) {
    const type = accTypeMap.get(g.accountId);
    const debit = toNum(g._sum?.debit ?? 0);
    const credit = toNum(g._sum?.credit ?? 0);
    if (type === "REVENUE") {
      revenue += credit - debit;
    } else if (type === "EXPENSE") {
      expense += debit - credit;
    }
  }

  return { netIncome: revenue - expense };
}

// -----------------------------------------------------------------------
// ダッシュボード（REQ-REPORT-003）
// -----------------------------------------------------------------------

/**
 * ダッシュボードデータを計算する
 */
export async function calcDashboard(periodId: string): Promise<DashboardData> {
  // 会計期間を取得
  const period = await prisma.fiscalPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) {
    throw new Error(`FiscalPeriod not found: ${periodId}`);
  }

  const entryWhere: Prisma.JournalEntryWhereInput = { status: EntryStatus.POSTED, fiscalPeriodId: periodId };

  // -----------------------------------------------------------------------
  // KPI: 収益・費用・当期純利益
  // -----------------------------------------------------------------------
  const plGroups = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      entry: entryWhere,
      account: { type: { in: ["REVENUE", "EXPENSE"] } },
    },
    _sum: { debit: true, credit: true },
  });

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    select: { id: true, type: true, code: true, name: true },
  });
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  let revenue = 0;
  let expense = 0;

  for (const g of plGroups) {
    const acc = accMap.get(g.accountId);
    if (!acc) continue;
    const debit = toNum(g._sum?.debit ?? 0);
    const credit = toNum(g._sum?.credit ?? 0);
    if (acc.type === "REVENUE") {
      revenue += credit - debit;
    } else if (acc.type === "EXPENSE") {
      expense += debit - credit;
    }
  }

  // KPI: 現金・預金残高（現金=101 / 普通預金=102 の借方残）
  const CASH_CODES = ["101", "102"];
  const cashGroups = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      entry: entryWhere,
      account: { type: "ASSET", code: { in: CASH_CODES } },
    },
    _sum: { debit: true, credit: true },
  });

  let cashBalance = 0;
  for (const g of cashGroups) {
    const acc = accMap.get(g.accountId);
    if (!acc) continue;
    const debit = toNum(g._sum?.debit ?? 0);
    const credit = toNum(g._sum?.credit ?? 0);
    cashBalance += debit - credit;
  }
  if (cashBalance < 0) cashBalance = 0;

  // KPI: 仕訳件数
  const entryCount = await prisma.journalEntry.count({ where: entryWhere });

  // -----------------------------------------------------------------------
  // 月次推移（期首から12ヶ月）
  // -----------------------------------------------------------------------
  const monthlyTrend = await calcMonthlyTrend(period, entryWhere);

  // -----------------------------------------------------------------------
  // 費用内訳（上位7科目 + その他）
  // -----------------------------------------------------------------------
  const expenseBreakdown = await calcExpenseBreakdown(entryWhere, accMap);

  // -----------------------------------------------------------------------
  // 直近5件の仕訳
  // -----------------------------------------------------------------------
  const recentEntriesRaw = await prisma.journalEntry.findMany({
    where: entryWhere,
    orderBy: [{ date: "desc" }, { entryNumber: "desc" }],
    take: 5,
    include: {
      lines: {
        include: { account: true },
        orderBy: { lineOrder: "asc" },
      },
    },
  });

  const recentEntries = recentEntriesRaw.map((e) => ({
    id: e.id,
    entryNumber: e.entryNumber,
    date: e.date.toISOString().split("T")[0],
    description: e.description,
    status: e.status as "DRAFT" | "POSTED",
    partnerId: e.partnerId,
    fiscalPeriodId: e.fiscalPeriodId,
    lines: e.lines.map((l) => ({
      id: l.id,
      accountId: l.accountId,
      account: l.account
        ? {
            id: l.account.id,
            code: l.account.code,
            name: l.account.name,
            type: l.account.type as import("@/types/ledger").AccountType,
            description: l.account.description,
            isActive: l.account.isActive,
          }
        : undefined,
      debit: toNum(l.debit),
      credit: toNum(l.credit),
      memo: l.memo,
      lineOrder: l.lineOrder,
    })),
  }));

  return {
    kpi: { revenue, expense, netIncome: revenue - expense, cashBalance, entryCount },
    monthlyTrend,
    expenseBreakdown,
    recentEntries,
  };
}

/**
 * 月次推移を計算する（期首から12ヶ月）
 */
async function calcMonthlyTrend(
  period: { startDate: Date; endDate: Date },
  baseEntryWhere: Prisma.JournalEntryWhereInput
): Promise<DashboardData["monthlyTrend"]> {
  const start = period.startDate;
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    if (d > period.endDate) break;
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const result: DashboardData["monthlyTrend"] = [];

  for (const { year, month } of months) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // 月末

    const groups = await prisma.journalLine.groupBy({
      by: ["accountId"],
      where: {
        entry: {
          ...baseEntryWhere,
          date: { gte: monthStart, lte: monthEnd },
        },
        account: { type: { in: ["REVENUE", "EXPENSE"] } },
      },
      _sum: { debit: true, credit: true },
    });

    const accounts = await prisma.account.findMany({
      where: {
        isActive: true,
        type: { in: ["REVENUE", "EXPENSE"] },
        id: { in: groups.map((g) => g.accountId) },
      },
      select: { id: true, type: true },
    });
    const accTypeMap = new Map(accounts.map((a) => [a.id, a.type]));

    let rev = 0;
    let exp = 0;
    for (const g of groups) {
      const type = accTypeMap.get(g.accountId);
      const debit = toNum(g._sum?.debit ?? 0);
      const credit = toNum(g._sum?.credit ?? 0);
      if (type === "REVENUE") {
        rev += credit - debit;
      } else if (type === "EXPENSE") {
        exp += debit - credit;
      }
    }

    result.push({
      month: `${year}-${String(month).padStart(2, "0")}`,
      revenue: rev,
      expense: exp,
      netIncome: rev - exp,
    });
  }

  return result;
}

/**
 * 費用内訳（上位7科目 + その他）を計算する
 */
async function calcExpenseBreakdown(
  baseEntryWhere: Prisma.JournalEntryWhereInput,
  accMap: Map<string, { id: string; type: string; code: string; name: string }>
): Promise<DashboardData["expenseBreakdown"]> {
  const groups = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      entry: baseEntryWhere,
      account: { type: "EXPENSE" },
    },
    _sum: { debit: true, credit: true },
    orderBy: { _sum: { debit: "desc" } },
  });

  const items: { accountName: string; amount: number }[] = groups.map((g) => {
    const acc = accMap.get(g.accountId);
    const debit = toNum(g._sum?.debit ?? 0);
    const credit = toNum(g._sum?.credit ?? 0);
    return {
      accountName: acc?.name ?? "不明",
      amount: debit - credit,
    };
  });

  // 金額で降順ソート
  items.sort((a, b) => b.amount - a.amount);

  if (items.length <= 7) {
    return items;
  }

  const top7 = items.slice(0, 7);
  const othersTotal = items.slice(7).reduce((s, r) => s + r.amount, 0);
  return [...top7, { accountName: "その他", amount: othersTotal }];
}
