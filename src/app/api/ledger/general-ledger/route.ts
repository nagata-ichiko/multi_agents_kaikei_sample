import { NextRequest } from "next/server";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-helpers";
import { calcGeneralLedger } from "@/lib/ledger/generalLedger";

// GET /api/ledger/general-ledger?accountId=必須&from=&to=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const accountId = searchParams.get("accountId");
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    if (!accountId) {
      return jsonError(422, "accountId は必須パラメータです");
    }

    const result = await calcGeneralLedger(accountId, from, to);
    if (!result) {
      return jsonError(404, "指定した勘定科目が見つかりません");
    }

    return jsonOk(result);
  } catch (e) {
    return handleApiError(e);
  }
}
