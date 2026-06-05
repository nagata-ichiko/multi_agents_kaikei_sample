"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type PartnerFilterBarProps = {
  q: string;
  type: string;
  active: string;
  onChange: (filters: { q?: string; type?: string; active?: string }) => void;
};

export function PartnerFilterBar({ q, type, active, onChange }: PartnerFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          label="検索"
          value={q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="コード・名称・カナで検索"
        />
      </div>
      <div className="w-36">
        <Select
          label="種別"
          value={type}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="">すべて</option>
          <option value="CUSTOMER">顧客</option>
          <option value="VENDOR">仕入先</option>
          <option value="BOTH">両方</option>
        </Select>
      </div>
      <div className="w-28">
        <Select
          label="状態"
          value={active}
          onChange={(e) => onChange({ active: e.target.value })}
        >
          <option value="">すべて</option>
          <option value="true">有効</option>
          <option value="false">無効</option>
        </Select>
      </div>
    </div>
  );
}
