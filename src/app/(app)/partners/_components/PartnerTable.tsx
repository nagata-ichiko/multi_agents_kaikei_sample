"use client";

import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Partner, PartnerType } from "@/types/master";

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  CUSTOMER: "顧客",
  VENDOR: "仕入先",
  BOTH: "両方",
};

const PARTNER_TYPE_VARIANTS: Record<PartnerType, "blue" | "amber" | "green"> = {
  CUSTOMER: "blue",
  VENDOR: "amber",
  BOTH: "green",
};

type PartnerTableProps = {
  partners: Partner[];
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
};

export function PartnerTable({ partners, onEdit, onDelete }: PartnerTableProps) {
  const columns: Column<Partner>[] = [
    {
      key: "code",
      header: "コード",
      render: (row) => (
        <span className="font-mono text-sm text-gray-700">{row.code}</span>
      ),
    },
    {
      key: "name",
      header: "名称",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.kana && <p className="text-xs text-gray-500">{row.kana}</p>}
        </div>
      ),
    },
    {
      key: "type",
      header: "種別",
      render: (row) => (
        <Badge variant={PARTNER_TYPE_VARIANTS[row.type]}>
          {PARTNER_TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "状態",
      render: (row) => (
        <Badge variant={row.isActive ? "green" : "gray"}>
          {row.isActive ? "有効" : "無効"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
            編集
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
            <span className="text-red-600">削除</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={partners}
      keyExtractor={(r) => r.id}
      emptyMessage="取引先がありません"
    />
  );
}
