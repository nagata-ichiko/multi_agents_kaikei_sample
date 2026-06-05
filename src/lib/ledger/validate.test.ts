import { describe, it, expect } from "vitest";
import { checkBalance } from "./balance";

describe("checkBalance", () => {
  it("借方合計と貸方合計が一致する場合 valid=true を返す", () => {
    const lines = [
      { debit: 10000, credit: 0 },
      { debit: 0, credit: 10000 },
    ];
    const result = checkBalance(lines);
    expect(result.valid).toBe(true);
    expect(result.diff).toBe(0);
    expect(result.totalDebit).toBe(10000);
    expect(result.totalCredit).toBe(10000);
  });

  it("借方合計と貸方合計が一致しない場合 valid=false を返す", () => {
    const lines = [
      { debit: 10000, credit: 0 },
      { debit: 0, credit: 5000 },
    ];
    const result = checkBalance(lines);
    expect(result.valid).toBe(false);
    expect(result.diff).toBe(5000);
  });

  it("複数行の合計で一致判定する", () => {
    const lines = [
      { debit: 3000, credit: 0 },
      { debit: 7000, credit: 0 },
      { debit: 0, credit: 10000 },
    ];
    const result = checkBalance(lines);
    expect(result.valid).toBe(true);
    expect(result.totalDebit).toBe(10000);
    expect(result.totalCredit).toBe(10000);
  });

  it("全行が0の場合 valid=true を返す", () => {
    const lines = [
      { debit: 0, credit: 0 },
      { debit: 0, credit: 0 },
    ];
    const result = checkBalance(lines);
    expect(result.valid).toBe(true);
    expect(result.diff).toBe(0);
  });

  it("借方合計が過剰な場合 diff > 0 を返す", () => {
    const lines = [
      { debit: 20000, credit: 0 },
      { debit: 0, credit: 15000 },
    ];
    const result = checkBalance(lines);
    expect(result.valid).toBe(false);
    expect(result.diff).toBe(5000);
  });

  it("貸方合計が過剰な場合 diff < 0 を返す", () => {
    const lines = [
      { debit: 5000, credit: 0 },
      { debit: 0, credit: 10000 },
    ];
    const result = checkBalance(lines);
    expect(result.valid).toBe(false);
    expect(result.diff).toBe(-5000);
  });
});
