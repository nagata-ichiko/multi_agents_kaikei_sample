import { describe, it, expect } from "vitest";
import { JournalEntryInputSchema, AccountCreateSchema, AccountUpdateSchema } from "./schemas";

describe("JournalEntryInputSchema", () => {
  const validEntry = {
    date: "2026-04-01",
    description: "テスト仕訳",
    lines: [
      { accountId: "acc1", debit: 10000, credit: 0 },
      { accountId: "acc2", debit: 0, credit: 10000 },
    ],
  };

  it("正常なデータを受け付ける", () => {
    const result = JournalEntryInputSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("日付が YYYY-MM-DD 形式でなければエラー", () => {
    const result = JournalEntryInputSchema.safeParse({
      ...validEntry,
      date: "2026/04/01",
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].path).toContain("date");
  });

  it("明細が1行以下の場合エラー", () => {
    const result = JournalEntryInputSchema.safeParse({
      ...validEntry,
      lines: [{ accountId: "acc1", debit: 10000, credit: 0 }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].path).toContain("lines");
  });

  it("同一明細行で借方・貸方が両方 > 0 の場合エラー", () => {
    const result = JournalEntryInputSchema.safeParse({
      ...validEntry,
      lines: [
        { accountId: "acc1", debit: 10000, credit: 5000 }, // 両方 > 0
        { accountId: "acc2", debit: 0, credit: 5000 },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].path).toContain("lines");
  });

  it("デフォルトステータスは POSTED", () => {
    const result = JournalEntryInputSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("POSTED");
    }
  });

  it("DRAFT ステータスを指定できる", () => {
    const result = JournalEntryInputSchema.safeParse({
      ...validEntry,
      status: "DRAFT",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("DRAFT");
    }
  });

  it("摘要が空の場合エラー", () => {
    const result = JournalEntryInputSchema.safeParse({
      ...validEntry,
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("借方・貸方が両方 0 の行は許可する（後で貸借一致で弾く）", () => {
    const result = JournalEntryInputSchema.safeParse({
      ...validEntry,
      lines: [
        { accountId: "acc1", debit: 0, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 0 },
      ],
    });
    // スキーマレベルでは通過（貸借一致の検証はサービス層）
    expect(result.success).toBe(true);
  });
});

describe("AccountCreateSchema", () => {
  const validAccount = {
    code: "101",
    name: "現金",
    type: "ASSET" as const,
  };

  it("正常なデータを受け付ける", () => {
    const result = AccountCreateSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });

  it("科目コードが空の場合エラー", () => {
    const result = AccountCreateSchema.safeParse({ ...validAccount, code: "" });
    expect(result.success).toBe(false);
  });

  it("科目名が空の場合エラー", () => {
    const result = AccountCreateSchema.safeParse({ ...validAccount, name: "" });
    expect(result.success).toBe(false);
  });

  it("不正な科目区分の場合エラー", () => {
    const result = AccountCreateSchema.safeParse({
      ...validAccount,
      type: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("5種類の科目区分を全て受け付ける", () => {
    const types = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const;
    for (const type of types) {
      const result = AccountCreateSchema.safeParse({ ...validAccount, type });
      expect(result.success).toBe(true);
    }
  });

  it("description は省略可能", () => {
    const result = AccountCreateSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });
});

describe("AccountUpdateSchema", () => {
  it("全フィールドが省略可能", () => {
    const result = AccountUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("isActive を false に更新できる", () => {
    const result = AccountUpdateSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});
