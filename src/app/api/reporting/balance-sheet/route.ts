import { type NextRequest } from "next/server";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { calcBalanceSheet } from "@/lib/reporting/aggregator";

/**
 * GET /api/reporting/balance-sheet
 * 貸借対照表
 *
 * クエリパラメータ:
 *   ?periodId=<string>       会計期間ID（必須）
 *   ?asOf=<YYYY-MM-DD>       基準日（省略時は期末）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const periodId = searchParams.get("periodId");
    const asOf = searchParams.get("asOf") ?? undefined;

    if (!periodId) {
      return jsonError(400, "periodId は必須です");
    }

    const result = await calcBalanceSheet(periodId, asOf);
    return jsonOk(result);
  } catch (e) {
    return handleApiError(e);
  }
}
