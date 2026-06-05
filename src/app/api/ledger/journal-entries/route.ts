import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { JournalEntryInputSchema } from "@/lib/ledger/schemas";
import { checkBalance, resolveFiscalPeriod } from "@/lib/ledger/validate";
import type { Decimal } from "@prisma/client/runtime/library";

function decimalToNumber(d: Decimal | number): number {
  if (typeof d === "number") return d;
  return Number(d.toString());
}

// GET /api/ledger/journal-entries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const accountId = searchParams.get("accountId");
    const partnerId = searchParams.get("partnerId");
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
    );

    const where: Record<string, unknown> = {};

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from + "T00:00:00.000Z");
      if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");
      where.date = dateFilter;
    }

    if (accountId) {
      where.lines = { some: { accountId } };
    }

    if (partnerId) {
      where.partnerId = partnerId;
    }

    if (q) {
      where.description = { contains: q, mode: "insensitive" };
    }

    const [total, entries] = await prisma.$transaction([
      prisma.journalEntry.count({ where }),
      prisma.journalEntry.findMany({
        where,
        orderBy: [{ date: "desc" }, { entryNumber: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          entryNumber: true,
          date: true,
          description: true,
          status: true,
          partnerId: true,
          fiscalPeriodId: true,
          partner: {
            select: { id: true, name: true },
          },
          lines: {
            orderBy: { lineOrder: "asc" },
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
        },
      }),
    ]);

    // Decimal → number 変換
    const result = entries.map((e) => ({
      ...e,
      date: e.date.toISOString().slice(0, 10),
      lines: e.lines.map((l) => ({
        ...l,
        debit: decimalToNumber(l.debit),
        credit: decimalToNumber(l.credit),
      })),
    }));

    return jsonOk({
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST /api/ledger/journal-entries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = JournalEntryInputSchema.parse(body);

    // 貸借一致チェック
    const balance = checkBalance(parsed.lines);
    if (!balance.valid) {
      return jsonError(
        422,
        `貸借が一致しません（借方合計: ${balance.totalDebit}, 貸方合計: ${balance.totalCredit}, 差額: ${balance.diff}）`
      );
    }

    // FiscalPeriod 解決
    const period = await resolveFiscalPeriod(parsed.date);
    if (!period) {
      return jsonError(422, "指定した日付に該当する会計期間がありません");
    }
    if (period.isClosed) {
      return jsonError(422, "指定した会計期間は締め済みのため仕訳を登録できません");
    }

    const entry = await prisma.journalEntry.create({
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
      select: {
        id: true,
        entryNumber: true,
        date: true,
        description: true,
        status: true,
        partnerId: true,
        fiscalPeriodId: true,
        lines: {
          orderBy: { lineOrder: "asc" },
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
      },
    });

    const result = {
      ...entry,
      date: entry.date.toISOString().slice(0, 10),
      lines: entry.lines.map((l) => ({
        ...l,
        debit: decimalToNumber(l.debit),
        credit: decimalToNumber(l.credit),
      })),
    };

    return jsonOk(result, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
