"use client";

import { formatCurrency } from "@/lib/format";
import type { StatementSection } from "@/types/reporting";

interface StatementSectionProps {
  section: StatementSection;
  labelColor?: string;
}

/**
 * 財務諸表セクション（収益・費用・資産・負債・純資産）の共通表示
 */
export function StatementSectionBlock({
  section,
  labelColor = "text-gray-700",
}: StatementSectionProps) {
  return (
    <div className="mb-4">
      <h3 className={`text-sm font-semibold ${labelColor} mb-2 pb-1 border-b border-gray-200`}>
        {section.label}
      </h3>
      <table className="w-full">
        <tbody>
          {section.rows.map((row) => (
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
              {section.label}合計
            </td>
            <td className="py-2 px-2 text-sm text-right font-bold text-gray-900">
              {formatCurrency(section.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
