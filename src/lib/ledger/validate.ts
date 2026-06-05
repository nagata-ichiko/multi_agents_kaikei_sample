import { prisma } from "@/lib/prisma";
export { checkBalance } from "./balance";

/**
 * 日付文字列 (YYYY-MM-DD) から FiscalPeriod を解決する
 * - 該当期間がなければ null を返す
 * - isClosed の期間は { id, isClosed: true } を返す
 */
export async function resolveFiscalPeriod(dateStr: string): Promise<{
  id: string;
  isClosed: boolean;
} | null> {
  const date = new Date(dateStr + "T00:00:00.000Z");
  const period = await prisma.fiscalPeriod.findFirst({
    where: {
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: { id: true, isClosed: true },
  });
  return period ?? null;
}
