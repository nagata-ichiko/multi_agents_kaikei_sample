"use client";

import { Select } from "@/components/ui/Select";
import type { FiscalPeriod } from "@/types/master";

interface FiscalPeriodSelectorProps {
  periods: FiscalPeriod[];
  selectedId: string;
  onChange: (id: string) => void;
}

/**
 * 会計期間セレクタ
 * ダッシュボード・試算表・財務諸表で共通使用
 */
export function FiscalPeriodSelector({
  periods,
  selectedId,
  onChange,
}: FiscalPeriodSelectorProps) {
  return (
    <Select
      label="会計期間"
      value={selectedId}
      onChange={(e) => onChange(e.target.value)}
      className="w-48"
    >
      <option value="">会計期間を選択</option>
      {periods.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </Select>
  );
}
