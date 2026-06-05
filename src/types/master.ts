export type PartnerType = "CUSTOMER" | "VENDOR" | "BOTH";

export type Partner = {
  id: string;
  code: string;          // 一意
  name: string;
  kana: string | null;
  type: PartnerType;
  email: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
};

export type FiscalPeriod = {
  id: string;
  name: string;          // 例: 2026年度
  startDate: string;     // YYYY-MM-DD
  endDate: string;
  isClosed: boolean;
};
