import { describe, it, expect } from "vitest";

// 残高計算ロジックを純粋関数として抽出してテスト
// generalLedger.ts の calcGeneralLedger は DB依存のため、ロジック部分を独立テスト

type LineInput = { debit: number; credit: number };

function calcRunningBalance(
  openingBalance: number,
  lines: LineInput[],
  accountType: string
): number[] {
  const isDebitNormal = ["ASSET", "EXPENSE"].includes(accountType);
  let running = openingBalance;
  return lines.map((l) => {
    const delta = isDebitNormal ? l.debit - l.credit : l.credit - l.debit;
    running += delta;
    return running;
  });
}

function calcOpeningBalance(
  lines: LineInput[],
  accountType: string
): number {
  const isDebitNormal = ["ASSET", "EXPENSE"].includes(accountType);
  const raw = lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
  return isDebitNormal ? raw : -raw;
}

describe("calcRunningBalance", () => {
  describe("資産科目（借方残）", () => {
    it("期首残高から借方を加算・貸方を減算する", () => {
      const balances = calcRunningBalance(
        10000,
        [
          { debit: 5000, credit: 0 },
          { debit: 0, credit: 3000 },
        ],
        "ASSET"
      );
      expect(balances).toEqual([15000, 12000]);
    });

    it("期首残高が0の場合", () => {
      const balances = calcRunningBalance(
        0,
        [{ debit: 10000, credit: 0 }],
        "ASSET"
      );
      expect(balances).toEqual([10000]);
    });

    it("複数行の累計残高が正しく計算される", () => {
      const balances = calcRunningBalance(
        0,
        [
          { debit: 10000, credit: 0 },
          { debit: 5000, credit: 0 },
          { debit: 0, credit: 8000 },
        ],
        "ASSET"
      );
      expect(balances).toEqual([10000, 15000, 7000]);
    });
  });

  describe("費用科目（借方残）", () => {
    it("借方で増加・貸方で減少する", () => {
      const balances = calcRunningBalance(
        0,
        [
          { debit: 5000, credit: 0 },
          { debit: 3000, credit: 0 },
        ],
        "EXPENSE"
      );
      expect(balances).toEqual([5000, 8000]);
    });
  });

  describe("負債科目（貸方残）", () => {
    it("貸方で増加・借方で減少する", () => {
      const balances = calcRunningBalance(
        10000,
        [
          { debit: 0, credit: 5000 },
          { debit: 3000, credit: 0 },
        ],
        "LIABILITY"
      );
      expect(balances).toEqual([15000, 12000]);
    });
  });

  describe("収益科目（貸方残）", () => {
    it("貸方で増加・借方で減少する", () => {
      const balances = calcRunningBalance(
        0,
        [
          { debit: 0, credit: 100000 },
          { debit: 0, credit: 50000 },
        ],
        "REVENUE"
      );
      expect(balances).toEqual([100000, 150000]);
    });
  });

  describe("純資産科目（貸方残）", () => {
    it("貸方で増加する", () => {
      const balances = calcRunningBalance(
        500000,
        [{ debit: 0, credit: 100000 }],
        "EQUITY"
      );
      expect(balances).toEqual([600000]);
    });
  });
});

describe("calcOpeningBalance", () => {
  it("資産科目: 借方合計 - 貸方合計 で期首残高", () => {
    const balance = calcOpeningBalance(
      [
        { debit: 10000, credit: 0 },
        { debit: 0, credit: 3000 },
      ],
      "ASSET"
    );
    expect(balance).toBe(7000);
  });

  it("負債科目: 貸方合計 - 借方合計 で期首残高（正値 = 貸方超過）", () => {
    const balance = calcOpeningBalance(
      [
        { debit: 0, credit: 10000 },
        { debit: 2000, credit: 0 },
      ],
      "LIABILITY"
    );
    expect(balance).toBe(8000);
  });

  it("明細が空の場合 0", () => {
    const balance = calcOpeningBalance([], "ASSET");
    expect(balance).toBe(0);
  });
});
