/**
 * クライアントサイド用のfetchユーティリティ
 * エラー時はmessageをthrowする
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // JSON パース失敗時はデフォルトメッセージを使用
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
