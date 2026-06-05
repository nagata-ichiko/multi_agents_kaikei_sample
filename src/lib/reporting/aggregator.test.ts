/**
 * reporting ドメイン 集計ロジック ユニットテスト
 *
 * DB に依存しない純粋関数のテストのみここで行う。
 * DB 依存の集計関数は Prisma をモックして検証する。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { calcBalance } from "./aggregator";

// -----------------------------------------------------------------------
// calcBalance: 残高計算規則のユニットテスト
// -----------------------------------------------------------------------

describe("calcBalance", () => {
  describe("ASSET - 借方残", () => {
    it("借方合計 > 貸方合計: 借方残高を返す", () => {
      const result = calcBalance("ASSET", 100, 30);
      expect(result.debitBalance).toBe(70);
      expect(result.creditBalance).toBe(0);
    });

    it("借方合計 === 貸方合計: 残高はゼロ", () => {
      const result = calcBalance("ASSET", 100, 100);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(0);
    });

    it("借方合計 < 貸方合計: 貸方残高を返す（資産のマイナス）", () => {
      const result = calcBalance("ASSET", 50, 80);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(30);
    });
  });

  describe("EXPENSE - 借方残", () => {
    it("費用発生（借方 > 貸方）: 借方残高を返す", () => {
      const result = calcBalance("EXPENSE", 200, 0);
      expect(result.debitBalance).toBe(200);
      expect(result.creditBalance).toBe(0);
    });

    it("費用戻し（借方 < 貸方）: 貸方残高を返す", () => {
      const result = calcBalance("EXPENSE", 0, 50);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(50);
    });
  });

  describe("LIABILITY - 貸方残", () => {
    it("負債増加（貸方 > 借方）: 貸方残高を返す", () => {
      const result = calcBalance("LIABILITY", 0, 500);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(500);
    });

    it("負債減少（借方 > 貸方）: 借方残高を返す", () => {
      const result = calcBalance("LIABILITY", 600, 100);
      expect(result.debitBalance).toBe(500);
      expect(result.creditBalance).toBe(0);
    });
  });

  describe("EQUITY - 貸方残", () => {
    it("純資産増加（貸方 > 借方）: 貸方残高を返す", () => {
      const result = calcBalance("EQUITY", 0, 1000000);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(1000000);
    });
  });

  describe("REVENUE - 貸方残", () => {
    it("収益計上（貸方 > 借方）: 貸方残高を返す", () => {
      const result = calcBalance("REVENUE", 0, 300000);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(300000);
    });

    it("収益戻し（借方 > 貸方）: 借方残高を返す", () => {
      const result = calcBalance("REVENUE", 50000, 300000);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(250000);
    });
  });
});

// -----------------------------------------------------------------------
// 試算表集計の整合性テスト（モック使用）
// -----------------------------------------------------------------------

// Prisma をモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findMany: vi.fn(),
    },
    journalLine: {
      groupBy: vi.fn(),
    },
    journalEntry: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    fiscalPeriod: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { calcTrialBalance, calcIncomeStatement, calcBalanceSheet } from "./aggregator";

const mockPrisma = prisma as unknown as {
  account: { findMany: ReturnType<typeof vi.fn> };
  journalLine: { groupBy: ReturnType<typeof vi.fn> };
  journalEntry: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  fiscalPeriod: { findUnique: ReturnType<typeof vi.fn> };
};

describe("calcTrialBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POSTED 仕訳のみ集計される（試算表の借方合計 = 貸方合計）", async () => {
    // 現金（ASSET）、売上（REVENUE）の2科目
    mockPrisma.account.findMany.mockResolvedValue([
      { id: "acc-1", code: "101", name: "現金", type: "ASSET", isActive: true },
      { id: "acc-2", code: "401", name: "売上高", type: "REVENUE", isActive: true },
    ]);

    // 現金 debit=100000, 売上 credit=100000（貸借一致の仕訳）
    mockPrisma.journalLine.groupBy.mockResolvedValue([
      { accountId: "acc-1", _sum: { debit: "100000", credit: "0" } },
      { accountId: "acc-2", _sum: { debit: "0", credit: "100000" } },
    ]);

    const result = await calcTrialBalance({ periodId: "period-1" });

    // 借方合計 = 貸方合計
    expect(result.totals.debit).toBe(result.totals.credit);
    expect(result.totals.debit).toBe(100000);

    // 現金の残高: 借方残
    const cashRow = result.rows.find((r) => r.accountId === "acc-1");
    expect(cashRow?.debitBalance).toBe(100000);
    expect(cashRow?.creditBalance).toBe(0);

    // 売上の残高: 貸方残
    const revenueRow = result.rows.find((r) => r.accountId === "acc-2");
    expect(revenueRow?.debitBalance).toBe(0);
    expect(revenueRow?.creditBalance).toBe(100000);
  });

  it("取引のない科目は残高0で含まれる", async () => {
    mockPrisma.account.findMany.mockResolvedValue([
      { id: "acc-1", code: "101", name: "現金", type: "ASSET", isActive: true },
      { id: "acc-3", code: "201", name: "買掛金", type: "LIABILITY", isActive: true },
    ]);
    // 現金のみ取引あり
    mockPrisma.journalLine.groupBy.mockResolvedValue([
      { accountId: "acc-1", _sum: { debit: "50000", credit: "0" } },
    ]);

    const result = await calcTrialBalance({ periodId: "period-1" });

    expect(result.rows).toHaveLength(2);
    const liabilityRow = result.rows.find((r) => r.accountId === "acc-3");
    expect(liabilityRow?.debitTotal).toBe(0);
    expect(liabilityRow?.creditTotal).toBe(0);
    expect(liabilityRow?.debitBalance).toBe(0);
    expect(liabilityRow?.creditBalance).toBe(0);
  });
});

describe("calcIncomeStatement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("当期純利益 = 収益合計 - 費用合計", async () => {
    mockPrisma.account.findMany.mockResolvedValue([
      { id: "acc-rev", code: "401", name: "売上高", type: "REVENUE", isActive: true },
      { id: "acc-exp", code: "501", name: "仕入高", type: "EXPENSE", isActive: true },
    ]);

    mockPrisma.journalLine.groupBy.mockResolvedValue([
      { accountId: "acc-rev", _sum: { debit: "0", credit: "500000" } },
      { accountId: "acc-exp", _sum: { debit: "300000", credit: "0" } },
    ]);

    const result = await calcIncomeStatement("period-1");

    expect(result.revenues.total).toBe(500000);
    expect(result.expenses.total).toBe(300000);
    expect(result.netIncome).toBe(200000); // 500000 - 300000
  });

  it("費用 > 収益の場合、当期純利益は負になる（赤字）", async () => {
    mockPrisma.account.findMany.mockResolvedValue([
      { id: "acc-rev", code: "401", name: "売上高", type: "REVENUE", isActive: true },
      { id: "acc-exp", code: "501", name: "仕入高", type: "EXPENSE", isActive: true },
    ]);

    mockPrisma.journalLine.groupBy.mockResolvedValue([
      { accountId: "acc-rev", _sum: { debit: "0", credit: "100000" } },
      { accountId: "acc-exp", _sum: { debit: "200000", credit: "0" } },
    ]);

    const result = await calcIncomeStatement("period-1");

    expect(result.netIncome).toBe(-100000);
  });
});

describe("calcBalanceSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("balanced: 資産合計 === 負債合計 + 純資産合計", async () => {
    // FiscalPeriod 取得
    mockPrisma.fiscalPeriod.findUnique.mockResolvedValue({
      id: "period-1",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
    });

    // BS 科目
    mockPrisma.account.findMany.mockImplementation(({ where }: { where?: { type?: { in?: string[] } } }) => {
      const types = where?.type?.in ?? [];
      if (types.includes("ASSET")) {
        return Promise.resolve([
          { id: "acc-cash", code: "101", name: "現金", type: "ASSET", isActive: true },
          { id: "acc-capital", code: "301", name: "資本金", type: "EQUITY", isActive: true },
        ]);
      }
      return Promise.resolve([]);
    });

    // BS groupBy:
    // - BS科目集計（account フィルタなし）は全明細を返す
    // - PL計算（account.type in [REVENUE, EXPENSE]）は空を返す
    mockPrisma.journalLine.groupBy.mockImplementation(({ where }: { where?: { account?: { type?: { in?: string[] } } } }) => {
      const types = where?.account?.type?.in ?? [];
      if (types.length > 0 && !types.includes("ASSET")) {
        // REVENUE/EXPENSE フィルタ（PL計算用）→ 空
        return Promise.resolve([]);
      }
      // BS科目集計（accountフィルタなし）→ 現金+資本金
      return Promise.resolve([
        { accountId: "acc-cash", _sum: { debit: "1000000", credit: "0" } },
        { accountId: "acc-capital", _sum: { debit: "0", credit: "1000000" } },
      ]);
    });

    const result = await calcBalanceSheet("period-1");

    // 資産合計 = 1000000, 純資産 = 1000000 + 0 (netIncome), 負債 = 0
    expect(result.assets.total).toBe(1000000);
    expect(result.balanced).toBe(true);

    // 当期純利益行が純資産に含まれる
    const netIncomeRow = result.equity.rows.find(
      (r) => r.accountName === "繰越利益剰余金（当期）"
    );
    expect(netIncomeRow).toBeDefined();
  });
});
