import { z } from "zod";

export const accountTypeValues = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
] as const;

export const AccountCreateSchema = z.object({
  code: z.string().min(1, "科目コードは必須です"),
  name: z.string().min(1, "科目名は必須です"),
  type: z.enum(accountTypeValues, { message: "科目区分が不正です" }),
  description: z.string().optional().nullable(),
});

export const AccountUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(accountTypeValues).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const JournalLineInputSchema = z.object({
  accountId: z.string().min(1, "科目IDは必須です"),
  debit: z.number().int().min(0, "借方金額は0以上の整数です"),
  credit: z.number().int().min(0, "貸方金額は0以上の整数です"),
  memo: z.string().optional().nullable(),
});

export const JournalEntryInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD 形式で入力してください"),
    description: z.string().min(1, "摘要は必須です"),
    status: z.enum(["DRAFT", "POSTED"]).optional().default("POSTED"),
    partnerId: z.string().optional().nullable(),
    lines: z
      .array(JournalLineInputSchema)
      .min(2, "明細は2行以上必要です"),
  })
  .refine(
    (data) => {
      // 各明細は debit XOR credit（両方 > 0 は禁止、両方 0 も禁止でない）
      return data.lines.every(
        (line) => !(line.debit > 0 && line.credit > 0)
      );
    },
    {
      message: "各明細の借方と貸方を同時に入力することはできません",
      path: ["lines"],
    }
  );
