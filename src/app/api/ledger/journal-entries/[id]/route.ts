import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { JournalEntryInputSchema } from "@/lib/ledger/schemas";
import { checkBalance, resolveFiscalPeriod } from "@/lib/ledger/validate";
import type { Decimal } from "@prisma/client/runtime/library";

type Params = { params: Promise<{ id: string }> };

function decimalToNumber(d: Decimal | number): number {
  if (typeof d === "number") return d;
  return Number(d.toString());
}

const entrySelect = {
  id: true,
  entryNumber: true,
  date: true,
  description: true,
  status: true,
  partnerId: true,
  fiscalPeriodId: true,
  lines: {
    orderBy: { lineOrder: "asc" } as const,
    select: {
      id: true,
      accountId: true,
      debit: true,
      credit: true,
      memo: true,
      lineOrder: true,
      account: {
        select: { id: true, code: true, name: true, type: true, description: true, isActive: true },
      },
    },
  },
};

function formatEntry(entry: {
  date: Date;
  lines: Array<{ debit: Decimal | number; credit: Decimal | number; [key: string]: unknown }>;
  [key: string]: unknown;
}) {
  return {
    ...entry,
    date: entry.date.toISOString().slice(0, 10),
    lines: entry.lines.map((l) => ({
      ...l,
      debit: decimalToNumber(l.debit),
      credit: decimalToNumber(l.credit),
    })),
  };
}

// GET /api/ledger/journal-entries/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      select: entrySelect,
    });
    if (!entry) return jsonError(404, "仕訳が見つかりません");
    return jsonOk(formatEntry(entry));
  } catch (e) {
    return handleApiError(e);
  }
}

// PATCH /api/ledger/journal-entries/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = JournalEntryInputSchema.parse(body);

    // 既存仕訳確認
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      include: { fiscalPeriod: { select: { isClosed: true } } },
    });
    if (!existing) return jsonError(404, "仕訳が見つかりません");

    // 現在の期間が締め済みか確認
    if (existing.fiscalPeriod.isClosed) {
      return jsonError(422, "締め済みの会計期間の仕訳は変更できません");
    }

    // 貸借一致チェック
    const balance = checkBalance(parsed.lines);
    if (!balance.valid) {
      return jsonError(
        422,
        `貸借が一致しません（借方合計: ${balance.totalDebit}, 貸方合計: ${balance.totalCredit}, 差額: ${balance.diff}）`
      );
    }

    // 新しい日付から FiscalPeriod 解決
    const period = await resolveFiscalPeriod(parsed.date);
    if (!period) {
      return jsonError(422, "指定した日付に該当する会計期間がありません");
    }
    if (period.isClosed) {
      return jsonError(422, "指定した会計期間は締め済みのため仕訳を変更できません");
    }

    // 明細を全置換（トランザクション）
    const updated = await prisma.$transaction(async (tx) => {
      // 既存明細を削除
      await tx.journalLine.deleteMany({ where: { entryId: id } });

      // 新しい明細で更新
      return tx.journalEntry.update({
        where: { id },
        data: {
          date: new Date(parsed.date + "T00:00:00.000Z"),
          description: parsed.description,
          status: parsed.status,
          partnerId: parsed.partnerId ?? null,
          fiscalPeriodId: period.id,
          lines: {
            create: parsed.lines.map((l, idx) => ({
              accountId: l.accountId,
              debit: l.debit,
              credit: l.credit,
              memo: l.memo ?? null,
              lineOrder: idx,
            })),
          },
        },
        select: entrySelect,
      });
    });

    return jsonOk(formatEntry(updated));
  } catch (e) {
    return handleApiError(e);
  }
}

// DELETE /api/ledger/journal-entries/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      include: { fiscalPeriod: { select: { isClosed: true } } },
    });
    if (!existing) return jsonError(404, "仕訳が見つかりません");

    if (existing.fiscalPeriod.isClosed) {
      return jsonError(422, "締め済みの会計期間の仕訳は削除できません");
    }

    await prisma.journalEntry.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
