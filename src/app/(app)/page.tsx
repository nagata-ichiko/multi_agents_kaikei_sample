"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { apiFetch } from "@/lib/client-fetch";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DashboardData } from "@/types/reporting";
import type { FiscalPeriod } from "@/types/master";
import type { JournalEntry } from "@/types/ledger";
import { FiscalPeriodSelector } from "./_components/FiscalPeriodSelector";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// -----------------------------------------------------------------------
// 定数
// -----------------------------------------------------------------------

const PIE_COLORS = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#94a3b8", // slate-400 (その他)
];

// -----------------------------------------------------------------------
// KPIカードコンポーネント
// -----------------------------------------------------------------------

function KpiCard({
  label,
  value,
  subLabel,
  highlight,
}: {
  label: string;
  value: string;
  subLabel?: string;
  highlight?: "red" | "green";
}) {
  const valueColor =
    highlight === "red"
      ? "text-red-600"
      : highlight === "green"
        ? "text-green-600"
        : "text-gray-900";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
    </div>
  );
}

// -----------------------------------------------------------------------
// ダッシュボードページ
// -----------------------------------------------------------------------

export default function DashboardPage() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 会計期間一覧を取得
  useEffect(() => {
    apiFetch<FiscalPeriod[]>("/api/master/fiscal-periods")
      .then((ps) => {
        setPeriods(ps);
        // 最新（未締め）期間を初期選択
        const latest = ps.find((p) => !p.isClosed) ?? ps[0];
        if (latest) setSelectedPeriodId(latest.id);
      })
      .catch(() => setError("会計期間の取得に失敗しました"));
  }, []);

  // ダッシュボードデータを取得
  const fetchData = useCallback((periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError(null);
    apiFetch<DashboardData>(`/api/reporting/dashboard?periodId=${periodId}`)
      .then(setData)
      .catch(() => setError("データの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedPeriodId) fetchData(selectedPeriodId);
  }, [selectedPeriodId, fetchData]);

  // 月次推移グラフ用にラベルを短縮（"2026-04" → "4月"）
  const trendData =
    data?.monthlyTrend.map((m) => ({
      ...m,
      label: `${parseInt(m.month.split("-")[1])}月`,
    })) ?? [];

  // 仕訳テーブルの列定義
  const entryColumns: Column<JournalEntry>[] = [
    {
      key: "date",
      header: "日付",
      render: (row) => formatDate(row.date),
    },
    {
      key: "description",
      header: "摘要",
    },
    {
      key: "amount",
      header: "金額（借方合計）",
      align: "right",
      render: (row) => {
        const total = row.lines.reduce((s, l) => s + l.debit, 0);
        return formatCurrency(total);
      },
    },
    {
      key: "status",
      header: "ステータス",
      align: "center",
      render: (row) => (
        <Badge variant={row.status === "POSTED" ? "green" : "amber"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="ダッシュボード"
          description="経営状況の概要を確認します"
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
        <>
          {/* KPI カード */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KpiCard
              label="売上高"
              value={formatCurrency(data.kpi.revenue)}
              highlight="green"
            />
            <KpiCard
              label="費用合計"
              value={formatCurrency(data.kpi.expense)}
            />
            <KpiCard
              label="当期純利益"
              value={formatCurrency(data.kpi.netIncome)}
              highlight={data.kpi.netIncome >= 0 ? "green" : "red"}
            />
            <KpiCard
              label="現金・預金残高"
              value={formatCurrency(data.kpi.cashBalance)}
            />
            <KpiCard
              label="仕訳件数"
              value={`${data.kpi.entryCount} 件`}
              subLabel="POSTED のみ"
            />
          </div>

          {/* グラフ行 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* 月次推移グラフ（2/3幅） */}
            <Card title="月次推移" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="gradRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradExpense"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop
                        offset="95%"
                        stopColor="#f97316"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`}
                    width={60}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="売上高"
                    stroke="#6366f1"
                    fill="url(#gradRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="費用"
                    stroke="#f97316"
                    fill="url(#gradExpense)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="netIncome"
                    name="当期純利益"
                    stroke="#22c55e"
                    fill="none"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* 費用内訳グラフ（1/3幅） */}
            <Card title="費用内訳">
              {data.expenseBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                  費用データがありません
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.expenseBreakdown}
                      dataKey="amount"
                      nameKey="accountName"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ percent }) =>
                        percent && percent > 0.05
                          ? `${(percent * 100).toFixed(0)}%`
                          : ""
                      }
                      labelLine={false}
                    >
                      {data.expenseBreakdown.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) =>
                        value.length > 8 ? value.slice(0, 8) + "…" : value
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* 直近仕訳テーブル */}
          <Card title="直近の仕訳（5件）">
            <Table
              columns={entryColumns}
              rows={data.recentEntries}
              keyExtractor={(r) => r.id}
              emptyMessage="仕訳がありません"
            />
          </Card>
        </>
      )}

      {!loading && !data && !error && selectedPeriodId && (
        <div className="text-center py-12 text-gray-400 text-sm">
          会計期間を選択するとデータが表示されます
        </div>
      )}
    </div>
  );
}
