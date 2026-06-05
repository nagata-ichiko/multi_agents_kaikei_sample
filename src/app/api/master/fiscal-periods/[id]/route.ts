import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { fiscalPeriodUpdateSchema } from "@/lib/master/schemas";
import { hasOverlapWithExisting } from "@/lib/master/fiscal-period-overlap";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = fiscalPeriodUpdateSchema.parse(body);

    // 存在確認
    const existing = await prisma.fiscalPeriod.findUnique({ where: { id } });
    if (!existing) {
      return jsonError(404, "会計期間が見つかりません");
    }

    // 日付が変更される場合は重複チェック
    const newStartDate = data.startDate ?? existing.startDate.toISOString().split("T")[0];
    const newEndDate = data.endDate ?? existing.endDate.toISOString().split("T")[0];

    if (data.startDate || data.endDate) {
      const allPeriods = await prisma.fiscalPeriod.findMany({
        select: { id: true, startDate: true, endDate: true },
      });

      const existingRanges = allPeriods.map((p) => ({
        id: p.id,
        startDate: p.startDate.toISOString().split("T")[0],
        endDate: p.endDate.toISOString().split("T")[0],
      }));

      if (
        hasOverlapWithExisting(
          { startDate: newStartDate, endDate: newEndDate },
          existingRanges,
          id // 自分自身は除外
        )
      ) {
        return jsonError(422, "指定した期間が既存の会計期間と重複しています");
      }
    }

    const period = await prisma.fiscalPeriod.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate !== undefined ? { endDate: new Date(data.endDate) } : {}),
        ...(data.isClosed !== undefined ? { isClosed: data.isClosed } : {}),
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isClosed: true,
      },
    });

    return jsonOk({
      id: period.id,
      name: period.name,
      startDate: period.startDate.toISOString().split("T")[0],
      endDate: period.endDate.toISOString().split("T")[0],
      isClosed: period.isClosed,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 存在確認
    const existing = await prisma.fiscalPeriod.findUnique({ where: { id } });
    if (!existing) {
      return jsonError(404, "会計期間が見つかりません");
    }

    // 仕訳の存在チェック
    const entryCount = await prisma.journalEntry.count({
      where: { fiscalPeriodId: id },
    });
    if (entryCount > 0) {
      return jsonError(409, "この会計期間には仕訳が存在するため削除できません");
    }

    await prisma.fiscalPeriod.delete({ where: { id } });

    return jsonOk({ message: "削除しました" });
  } catch (e) {
    return handleApiError(e);
  }
}
