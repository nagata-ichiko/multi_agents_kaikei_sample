"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/client-fetch";
import type { TrialBalance } from "@/types/reporting";
import type { FiscalPeriod } from "@/types/master";
import { FiscalPeriodSelector } from "@/app/(app)/_components/FiscalPeriodSelector";
import { TrialBalanceTable } from "./_components/TrialBalanceTable";

export default function TrialBalancePage() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [data, setData] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 会計期間一覧を取得
  useEffect(() => {
    apiFetch<FiscalPeriod[]>("/api/master/fiscal-periods")
      .then((ps) => {
        setPeriods(ps);
        const latest = ps.find((p) => !p.isClosed) ?? ps[0];
        if (latest) setSelectedPeriodId(latest.id);
      })
      .catch(() => setError("会計期間の取得に失敗しました"));
  }, []);

  // 試算表データを取得
  const fetchData = useCallback((periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError(null);
    apiFetch<TrialBalance>(`/api/reporting/trial-balance?periodId=${periodId}`)
      .then(setData)
      .catch(() => setError("試算表データの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedPeriodId) fetchData(selectedPeriodId);
  }, [selectedPeriodId, fetchData]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="合計残高試算表"
          description="期間内の借方合計・貸方合計・残高を科目別に表示します"
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
          <TrialBalanceTable data={data} />
        </Card>
      )}

      {!loading && !data && !error && selectedPeriodId && (
        <div className="text-center py-12 text-gray-400 text-sm">
          会計期間を選択してください
        </div>
      )}
    </div>
  );
}
