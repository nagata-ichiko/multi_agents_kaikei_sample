import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * 成功レスポンス（200）を返す
 */
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * エラーレスポンスを返す
 */
export function jsonError(
  status: number,
  message: string,
  details?: unknown
): NextResponse {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * エラーをハンドルしてNextResponseを返す
 * - ZodError → 422
 * - その他 → 500
 */
export function handleApiError(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    return jsonError(422, "Validation error", e.errors);
  }
  console.error(e);
  return jsonError(500, "Internal server error");
}
