import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, parseYmd } from "./format";

describe("formatCurrency", () => {
  it("カンマ区切りの数値を含む文字列を返す", () => {
    const result = formatCurrency(1234567);
    expect(result).toContain("1,234,567");
  });

  it("0を通貨表記にフォーマットする", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("小さい金額をフォーマットする", () => {
    const result = formatCurrency(100);
    expect(result).toContain("100");
  });

  it("1000単位でカンマ区切りになる", () => {
    const result = formatCurrency(1000);
    expect(result).toContain("1,000");
  });
});

describe("formatDate", () => {
  it("Dateオブジェクトを YYYY/MM/DD にフォーマットする", () => {
    expect(formatDate(new Date(2026, 3, 1))).toBe("2026/04/01");
  });

  it("ISO文字列を YYYY/MM/DD にフォーマットする", () => {
    const result = formatDate("2026-06-05T00:00:00.000Z");
    // タイムゾーンに依存するため結果のフォーマット形式のみ確認
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });

  it("月と日がひとけたの場合0パディングされる", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026/01/05");
  });
});

describe("parseYmd", () => {
  it("YYYY-MM-DD をDateオブジェクトに変換する", () => {
    const d = parseYmd("2026-04-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // 0-indexed
    expect(d.getDate()).toBe(1);
  });

  it("2025-12-31を正しく変換する", () => {
    const d = parseYmd("2025-12-31");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});
