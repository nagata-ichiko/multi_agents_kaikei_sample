"use client";

import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { FiscalPeriod } from "@/types/master";

type FiscalPeriodTableProps = {
  periods: FiscalPeriod[];
  onEdit: (period: FiscalPeriod) => void;
  onDelete: (period: FiscalPeriod) => void;
  onToggleClosed: (period: FiscalPeriod) => void;
  togglingId?: string | null;
};

export function FiscalPeriodTable({
  periods,
  onEdit,
  onDelete,
  onToggleClosed,
  togglingId,
}: FiscalPeriodTableProps) {
  const columns: Column<FiscalPeriod>[] = [
    {
      key: "name",
      header: "名称",
      render: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: "startDate",
      header: "開始日",
      render: (row) => (
        <span className="text-sm text-gray-700">{formatDate(row.startDate)}</span>
      ),
    },
    {
      key: "endDate",
      header: "終了日",
      render: (row) => (
        <span className="text-sm text-gray-700">{formatDate(row.endDate)}</span>
      ),
    },
    {
      key: "isClosed",
      header: "締め状態",
      render: (row) => (
        <Badge variant={row.isClosed ? "red" : "green"}>
          {row.isClosed ? "締め済み" : "未締め"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleClosed(row)}
            loading={togglingId === row.id}
          >
            <span className={row.isClosed ? "text-green-600" : "text-amber-600"}>
              {row.isClosed ? "締め解除" : "締める"}
            </span>
          </Button>
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
      rows={periods}
      keyExtractor={(r) => r.id}
      emptyMessage="会計期間がありません"
    />
  );
}
