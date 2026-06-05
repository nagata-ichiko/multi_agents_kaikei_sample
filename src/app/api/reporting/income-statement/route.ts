import { type NextRequest } from "next/server";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { calcIncomeStatement } from "@/lib/reporting/aggregator";

/**
 * GET /api/reporting/income-statement
 * 損益計算書
 *
 * クエリパラメータ:
 *   ?periodId=<string>  会計期間ID（必須）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const periodId = searchParams.get("periodId");

    if (!periodId) {
      return jsonError(400, "periodId は必須です");
    }

    const result = await calcIncomeStatement(periodId);
    return jsonOk(result);
  } catch (e) {
    return handleApiError(e);
  }
}
