"use client";

import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import type { BalanceSheet } from "@/types/reporting";

interface BalanceSheetTableProps {
  data: BalanceSheet;
}

function Section({
  label,
  rows,
  total,
  labelColor,
}: {
  label: string;
  rows: { accountId: string; accountCode: string; accountName: string; amount: number }[];
  total: number;
  labelColor: string;
}) {
  return (
    <div className="mb-4">
      <h3 className={`text-sm font-semibold ${labelColor} mb-2 pb-1 border-b border-gray-200`}>
        {label}
      </h3>
      <table className="w-full">
        <tbody>
          {rows.map((row) => (
            <tr key={row.accountId} className="hover:bg-gray-50">
              <td className="py-1.5 px-2 text-sm text-gray-500 font-mono w-16">
                {row.accountCode}
              </td>
              <td className="py-1.5 px-2 text-sm text-gray-800">
                {row.accountName}
              </td>
              <td className="py-1.5 px-2 text-sm text-right text-gray-800">
                {formatCurrency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-300">
            <td colSpan={2} className="py-2 px-2 text-sm font-semibold text-gray-700">
              {label}合計
            </td>
            <td className="py-2 px-2 text-sm text-right font-bold text-gray-900">
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * 貸借対照表
 * 資産 / 負債 / 純資産の3セクション + 貸借一致バッジ
 */
export function BalanceSheetTable({ data }: BalanceSheetTableProps) {
  return (
    <div>
      {/* 貸借一致バッジ */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">貸借一致:</span>
        <Badge variant={data.balanced ? "green" : "red"}>
          {data.balanced ? "一致" : "不一致"}
        </Badge>
        <span className="text-xs text-gray-400">
          （資産合計 = 負債合計 + 純資産合計）
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 借方: 資産 */}
        <div>
          <Section
            label={data.assets.label}
            rows={data.assets.rows}
            total={data.assets.total}
            labelColor="text-blue-700"
          />
        </div>

        {/* 貸方: 負債 + 純資産 */}
        <div>
          <Section
            label={data.liabilities.label}
            rows={data.liabilities.rows}
            total={data.liabilities.total}
            labelColor="text-red-700"
          />
          <Section
            label={data.equity.label}
            rows={data.equity.rows}
            total={data.equity.total}
            labelColor="text-green-700"
          />

          {/* 負債 + 純資産 合計 */}
          <div className="mt-4 pt-3 border-t-2 border-gray-400 flex justify-between px-2">
            <span className="text-sm font-bold text-gray-900">
              負債・純資産合計
            </span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(data.liabilities.total + data.equity.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
