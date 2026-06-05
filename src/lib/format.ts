/**
 * 数値を日本円表記にフォーマットする
 * 例: 1234567 → "¥1,234,567"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * 日付を "YYYY/MM/DD" 形式にフォーマットする
 * 例: new Date("2026-04-01") → "2026/04/01"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/**
 * "YYYY-MM-DD" 文字列をDateオブジェクトに変換する
 */
export function parseYmd(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}
