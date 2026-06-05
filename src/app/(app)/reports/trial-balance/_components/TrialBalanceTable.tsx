"use client";

import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import type { TrialBalance, TrialBalanceRow } from "@/types/reporting";
import Link from "next/link";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  ASSET: "資産",
  LIABILITY: "負債",
  EQUITY: "純資産",
  REVENUE: "収益",
  EXPENSE: "費用",
};

interface TrialBalanceTableProps {
  data: TrialBalance;
}

/**
 * 合計残高試算表テーブル
 * 科目クリックで総勘定元帳（/books/general-ledger?accountId=）へ遷移する
 */
export function TrialBalanceTable({ data }: TrialBalanceTableProps) {
  const isBalanced =
    Math.abs(data.totals.debit - data.totals.credit) < 1;

  return (
    <div className="overflow-x-auto">
      {/* 貸借一致バッジ */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-gray-600">貸借一致:</span>
        <Badge variant={isBalanced ? "green" : "red"}>
          {isBalanced ? "一致" : "不一致"}
        </Badge>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
              科目コード
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              科目名
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              区分
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              借方合計
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              貸方合計
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              借方残高
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              貸方残高
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.rows.map((row: TrialBalanceRow) => (
            <tr key={row.accountId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                {row.accountCode}
              </td>
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/books/general-ledger?accountId=${row.accountId}`}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {row.accountName}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {ACCOUNT_TYPE_LABEL[row.accountType] ?? row.accountType}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-800">
                {row.debitTotal > 0 ? formatCurrency(row.debitTotal) : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-800">
                {row.creditTotal > 0 ? formatCurrency(row.creditTotal) : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {row.debitBalance > 0 ? formatCurrency(row.debitBalance) : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {row.creditBalance > 0 ? formatCurrency(row.creditBalance) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100">
          <tr>
            <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">
              合計
            </td>
            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
              {formatCurrency(data.totals.debit)}
            </td>
            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
              {formatCurrency(data.totals.credit)}
            </td>
            <td colSpan={2} className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
