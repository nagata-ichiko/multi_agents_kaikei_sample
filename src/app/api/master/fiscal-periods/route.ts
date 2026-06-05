import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { fiscalPeriodCreateSchema } from "@/lib/master/schemas";
import { hasOverlapWithExisting } from "@/lib/master/fiscal-period-overlap";

export async function GET() {
  try {
    const periods = await prisma.fiscalPeriod.findMany({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isClosed: true,
      },
    });

    // DateオブジェクトをYYYY-MM-DD文字列に変換
    const result = periods.map((p) => ({
      id: p.id,
      name: p.name,
      startDate: p.startDate.toISOString().split("T")[0],
      endDate: p.endDate.toISOString().split("T")[0],
      isClosed: p.isClosed,
    }));

    return jsonOk(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = fiscalPeriodCreateSchema.parse(body);

    // 既存期間の取得（重複チェック用）
    const existingPeriods = await prisma.fiscalPeriod.findMany({
      select: { id: true, startDate: true, endDate: true },
    });

    const existingRanges = existingPeriods.map((p) => ({
      id: p.id,
      startDate: p.startDate.toISOString().split("T")[0],
      endDate: p.endDate.toISOString().split("T")[0],
    }));

    if (hasOverlapWithExisting({ startDate: data.startDate, endDate: data.endDate }, existingRanges)) {
      return jsonError(422, "指定した期間が既存の会計期間と重複しています");
    }

    const period = await prisma.fiscalPeriod.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isClosed: true,
      },
    });

    return jsonOk(
      {
        id: period.id,
        name: period.name,
        startDate: period.startDate.toISOString().split("T")[0],
        endDate: period.endDate.toISOString().split("T")[0],
        isClosed: period.isClosed,
      },
      201
    );
  } catch (e) {
    return handleApiError(e);
  }
}
