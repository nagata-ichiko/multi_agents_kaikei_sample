import { z } from "zod";

// 取引先バリデーションスキーマ
export const partnerCreateSchema = z.object({
  code: z.string().min(1, "取引先コードは必須です").max(50, "取引先コードは50文字以内です"),
  name: z.string().min(1, "名称は必須です").max(100, "名称は100文字以内です"),
  kana: z.string().max(100, "カナは100文字以内です").nullable().optional(),
  type: z.enum(["CUSTOMER", "VENDOR", "BOTH"], {
    errorMap: () => ({ message: "種別はCUSTOMER/VENDOR/BOTHのいずれかです" }),
  }),
  email: z.string().email("メールアドレスの形式が正しくありません").nullable().optional(),
  phone: z.string().max(20, "電話番号は20文字以内です").nullable().optional(),
  address: z.string().max(200, "住所は200文字以内です").nullable().optional(),
  note: z.string().max(500, "備考は500文字以内です").nullable().optional(),
});

export const partnerUpdateSchema = partnerCreateSchema.extend({
  isActive: z.boolean().optional(),
}).partial();

// 会計期間バリデーションスキーマ
export const fiscalPeriodCreateSchema = z.object({
  name: z.string().min(1, "名称は必須です").max(100, "名称は100文字以内です"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "開始日はYYYY-MM-DD形式で入力してください"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "終了日はYYYY-MM-DD形式で入力してください"),
}).refine(
  (data) => data.startDate <= data.endDate,
  { message: "終了日は開始日以降の日付を入力してください", path: ["endDate"] }
);

export const fiscalPeriodUpdateSchema = z.object({
  name: z.string().min(1, "名称は必須です").max(100, "名称は100文字以内です").optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "開始日はYYYY-MM-DD形式で入力してください")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "終了日はYYYY-MM-DD形式で入力してください")
    .optional(),
  isClosed: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: "終了日は開始日以降の日付を入力してください", path: ["endDate"] }
);

export type PartnerCreateInput = z.infer<typeof partnerCreateSchema>;
export type PartnerUpdateInput = z.infer<typeof partnerUpdateSchema>;
export type FiscalPeriodCreateInput = z.infer<typeof fiscalPeriodCreateSchema>;
export type FiscalPeriodUpdateInput = z.infer<typeof fiscalPeriodUpdateSchema>;
