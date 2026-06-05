"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/client-fetch";
import type { BalanceSheet } from "@/types/reporting";
import type { FiscalPeriod } from "@/types/master";
import { FiscalPeriodSelector } from "@/app/(app)/_components/FiscalPeriodSelector";
import { BalanceSheetTable } from "./_components/BalanceSheetTable";

export default function BalanceSheetPage() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [asOf, setAsOf] = useState<string>("");
  const [data, setData] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<FiscalPeriod[]>("/api/master/fiscal-periods")
      .then((ps) => {
        setPeriods(ps);
        const latest = ps.find((p) => !p.isClosed) ?? ps[0];
        if (latest) {
          setSelectedPeriodId(latest.id);
          // 初期基準日: 期末日
          setAsOf(latest.endDate);
        }
      })
      .catch(() => setError("会計期間の取得に失敗しました"));
  }, []);

  const fetchData = useCallback((periodId: string, asOfDate: string) => {
    if (!periodId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ periodId });
    if (asOfDate) params.set("asOf", asOfDate);
    apiFetch<BalanceSheet>(`/api/reporting/balance-sheet?${params.toString()}`)
      .then(setData)
      .catch(() => setError("貸借対照表データの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedPeriodId) fetchData(selectedPeriodId, asOf);
  }, [selectedPeriodId, asOf, fetchData]);

  const handlePeriodChange = (id: string) => {
    setSelectedPeriodId(id);
    // 期間変更時は基準日をその期末に更新
    const p = periods.find((fp) => fp.id === id);
    if (p) setAsOf(p.endDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="貸借対照表"
          description="指定日時点の資産・負債・純資産を表示します"
        />
        <div className="flex items-end gap-3">
          <FiscalPeriodSelector
            periods={periods}
            selectedId={selectedPeriodId}
            onChange={handlePeriodChange}
          />
          <Input
            label="基準日"
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className="w-44"
          />
        </div>
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
          <BalanceSheetTable data={data} />
        </Card>
      )}
    </div>
  );
}
