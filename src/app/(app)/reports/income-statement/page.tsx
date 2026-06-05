"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/client-fetch";
import { formatCurrency } from "@/lib/format";
import type { IncomeStatement } from "@/types/reporting";
import type { FiscalPeriod } from "@/types/master";
import { FiscalPeriodSelector } from "@/app/(app)/_components/FiscalPeriodSelector";
import { StatementSectionBlock } from "./_components/StatementSection";

export default function IncomeStatementPage() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<FiscalPeriod[]>("/api/master/fiscal-periods")
      .then((ps) => {
        setPeriods(ps);
        const latest = ps.find((p) => !p.isClosed) ?? ps[0];
        if (latest) setSelectedPeriodId(latest.id);
      })
      .catch(() => setError("会計期間の取得に失敗しました"));
  }, []);

  const fetchData = useCallback((periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError(null);
    apiFetch<IncomeStatement>(
      `/api/reporting/income-statement?periodId=${periodId}`
    )
      .then(setData)
      .catch(() => setError("損益計算書データの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedPeriodId) fetchData(selectedPeriodId);
  }, [selectedPeriodId, fetchData]);

  const isLoss = data && data.netIncome < 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="損益計算書"
          description="期間内の収益・費用・当期純利益を表示します"
        />
        <FiscalPeriodSelector
          periods={periods}
          selectedId={selectedPeriodId}
          onChange={setSelectedPeriodId}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12 text-gray-400 text-sm">
          読み込み中...
        </div>
      )}

      {!loading && data && (
        <Card>
          <div className="max-w-2xl">
            {/* 収益セクション */}
            <StatementSectionBlock
              section={data.revenues}
              labelColor="text-indigo-700"
            />

            {/* 費用セクション */}
            <StatementSectionBlock
              section={data.expenses}
              labelColor="text-orange-700"
            />

            {/* 当期純利益 */}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="flex items-center justify-between px-2 py-3">
                <span className="text-base font-bold text-gray-900">
                  当期純利益
                </span>
                <span
                  className={`text-xl font-bold ${
                    isLoss ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {formatCurrency(data.netIncome)}
                  {isLoss && (
                    <span className="ml-2 text-sm font-normal">（赤字）</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
