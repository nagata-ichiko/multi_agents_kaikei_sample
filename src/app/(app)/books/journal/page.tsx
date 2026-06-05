"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/client-fetch";
import { formatCurrency, formatDate, parseYmd } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { JournalEntry, Account } from "@/types/ledger";

type ListResponse = {
  data: JournalEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function JournalBookPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");

  useEffect(() => {
    apiFetch<Account[]>("/api/ledger/accounts").then(setAccounts).catch(() => {});
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      if (filterAccountId) params.set("accountId", filterAccountId);
      params.set("limit", "200");

      const result = await apiFetch<ListResponse>(
        `/api/ledger/journal-entries?${params}`
      );
      // 仕訳帳は POSTED のみ表示
      setEntries(result.data.filter((e) => e.status === "POSTED"));
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [filterFrom, filterTo, filterAccountId, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="仕訳帳"
        description="確定済み仕訳の時系列一覧"
      />

      {/* フィルタ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <Input
              label="期間（開始）"
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="期間（終了）"
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              label="勘定科目"
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
            >
              <option value="">全て</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* 仕訳帳テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : entries.length === 0 ? (
          <EmptyState
            message="仕訳がありません"
            description="フィルタ条件を変更するか、仕訳を登録してください"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-28">日付</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-16">番号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">摘要</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">借方科目</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 w-32">借方金額</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">貸方科目</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 w-32">貸方金額</th>
                  <th className="py-3 px-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const debitLines = entry.lines.filter((l) => l.debit > 0);
                  const creditLines = entry.lines.filter((l) => l.credit > 0);
                  const maxRows = Math.max(debitLines.length, creditLines.length);
                  return Array.from({ length: maxRows }).map((_, rowIdx) => (
                    <tr
                      key={`${entry.id}-${rowIdx}`}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      {rowIdx === 0 ? (
                        <>
                          <td className="py-2 px-4 text-gray-700">
                            {formatDate(parseYmd(entry.date))}
                          </td>
                          <td className="py-2 px-4">
                            <span className="font-mono text-xs text-gray-500">
                              #{entry.entryNumber}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-gray-800">
                            {entry.description}
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} />
                      )}
                      <td className="py-2 px-4 text-gray-700">
                        {debitLines[rowIdx]
                          ? `${debitLines[rowIdx].account?.code ?? ""} ${debitLines[rowIdx].account?.name ?? ""}`
                          : ""}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {debitLines[rowIdx]
                          ? formatCurrency(debitLines[rowIdx].debit)
                          : ""}
                      </td>
                      <td className="py-2 px-4 text-gray-700">
                        {creditLines[rowIdx]
                          ? `${creditLines[rowIdx].account?.code ?? ""} ${creditLines[rowIdx].account?.name ?? ""}`
                          : ""}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {creditLines[rowIdx]
                          ? formatCurrency(creditLines[rowIdx].credit)
                          : ""}
                      </td>
                      {rowIdx === 0 ? (
                        <td className="py-2 px-4 text-right">
                          <Link href={`/journal-entries/${entry.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              編集
                            </Button>
                          </Link>
                        </td>
                      ) : (
                        <td />
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
