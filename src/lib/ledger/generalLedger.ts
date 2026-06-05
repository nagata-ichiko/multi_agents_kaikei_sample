import { prisma } from "@/lib/prisma";
import type { Decimal } from "@prisma/client/runtime/library";

export type GeneralLedgerLine = {
  id: string;
  entryId: string;
  date: string;
  entryNumber: number;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

export type GeneralLedgerResult = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  lines: GeneralLedgerLine[];
};

function toNumber(d: Decimal | number): number {
  if (typeof d === "number") return d;
  return Number(d.toString());
}

/**
 * 総勘定元帳データを計算して返す
 * - 資産/費用: 借方残（正値 = 借方超過）
 * - 負債/純資産/収益: 貸方残（正値 = 貸方超過）
 * 期首残高は from より前の累積残高（POSTED のみ）
 */
export async function calcGeneralLedger(
  accountId: string,
  from?: string,
  to?: string
): Promise<GeneralLedgerResult | null> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, code: true, name: true, type: true },
  });
  if (!account) return null;

  // 期首残高: from より前の全 POSTED 明細の累積
  let openingBalance = 0;
  if (from) {
    const fromDate = new Date(from + "T00:00:00.000Z");
    const beforeLines = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          status: "POSTED",
          date: { lt: fromDate },
        },
      },
      select: { debit: true, credit: true },
    });
    for (const l of beforeLines) {
      openingBalance += toNumber(l.debit) - toNumber(l.credit);
    }
    // 負債/純資産/収益は貸方残のため符号を反転して「貸方超過正」に統一
    if (["LIABILITY", "EQUITY", "REVENUE"].includes(account.type)) {
      openingBalance = -openingBalance;
    }
  }

  // 対象期間の明細
  const whereDate: Record<string, Date> = {};
  if (from) whereDate.gte = new Date(from + "T00:00:00.000Z");
  if (to) whereDate.lte = new Date(to + "T23:59:59.999Z");

  const rawLines = await prisma.journalLine.findMany({
    where: {
      accountId,
      entry: {
        status: "POSTED",
        ...(Object.keys(whereDate).length > 0 ? { date: whereDate } : {}),
      },
    },
    select: {
      id: true,
      entryId: true,
      debit: true,
      credit: true,
      memo: true,
      entry: {
        select: {
          entryNumber: true,
          date: true,
          description: true,
        },
      },
    },
    orderBy: [{ entry: { date: "asc" } }, { entry: { entryNumber: "asc" } }],
  });

  // 残高タイプに応じたデルタ計算
  // ASSET/EXPENSE: debit増・credit減 → delta = debit - credit
  // LIABILITY/EQUITY/REVENUE: credit増・debit減 → delta = credit - debit
  const isDebitNormal = ["ASSET", "EXPENSE"].includes(account.type);

  let runningBalance = openingBalance;
  const lines: GeneralLedgerLine[] = rawLines.map((l) => {
    const d = toNumber(l.debit);
    const c = toNumber(l.credit);
    const delta = isDebitNormal ? d - c : c - d;
    runningBalance += delta;
    return {
      id: l.id,
      entryId: l.entryId,
      date: l.entry.date.toISOString().slice(0, 10),
      entryNumber: l.entry.entryNumber,
      description: l.entry.description,
      debit: d,
      credit: c,
      balance: runningBalance,
    };
  });

  return {
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    accountType: account.type,
    openingBalance,
    lines,
  };
}
