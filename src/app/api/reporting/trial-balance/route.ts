import { type NextRequest } from "next/server";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { calcTrialBalance } from "@/lib/reporting/aggregator";

/**
 * GET /api/reporting/trial-balance
 * 合計残高試算表
 *
 * クエリパラメータ:
 *   ?periodId=<string>         会計期間ID
 *   ?from=<YYYY-MM-DD>         期間開始日
 *   ?to=<YYYY-MM-DD>           期間終了日
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const periodId = searchParams.get("periodId") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    if (!periodId && !from && !to) {
      return jsonError(400, "periodId または from/to を指定してください");
    }

    const result = await calcTrialBalance({ periodId, from, to });
    return jsonOk(result);
  } catch (e) {
    return handleApiError(e);
  }
}
