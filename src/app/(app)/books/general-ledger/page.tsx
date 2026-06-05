"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/client-fetch";
import { formatCurrency, formatDate, parseYmd } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { Account } from "@/types/ledger";

// API レスポンス型（src/lib/ledger/generalLedger.ts の GeneralLedgerResult と同型）
type GeneralLedgerLine = {
  id: string;
  entryId: string;
  date: string;
  entryNumber: number;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

type GeneralLedgerResult = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  lines: GeneralLedgerLine[];
};

export default function GeneralLedgerPage() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [ledger, setLedger] = useState<GeneralLedgerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    apiFetch<Account[]>("/api/ledger/accounts?active=true")
      .then(setAccounts)
      .catch(() => {});
  }, []);

  const fetchLedger = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ accountId });
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      const result = await apiFetch<GeneralLedgerResult>(
        `/api/ledger/general-ledger?${params}`
      );
      setLedger(result);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "取得に失敗しました");
      setLedger(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, filterFrom, filterTo, showToast]);

  useEffect(() => {
    if (accountId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLedger();
    } else {
      setLedger(null);
      setSearched(false);
    }
  }, [accountId, filterFrom, filterTo, fetchLedger]);

  const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    ASSET: "資産",
    LIABILITY: "負債",
    EQUITY: "純資産",
    REVENUE: "収益",
    EXPENSE: "費用",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="総勘定元帳"
        description="科目別の期首残高・明細・累計残高を表示します"
      />

      {/* フィルタ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-56">
            <Select
              label="勘定科目（必須）"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">科目を選択してください</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
            </Select>
          </div>
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
        </div>
      </div>

      {/* 元帳 */}
      {!searched && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          科目を選択すると総勘定元帳が表示されます
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-gray-500">読み込み中...</div>
      )}

      {searched && !loading && !ledger && (
        <EmptyState message="データが見つかりません" />
      )}

      {ledger && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 科目ヘッダー */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="font-mono text-gray-500">{ledger.accountCode}</span>
              <span className="font-semibold text-gray-900 text-lg">{ledger.accountName}</span>
              <span className="text-sm text-gray-500">
                {ACCOUNT_TYPE_LABELS[ledger.accountType] ?? ledger.accountType}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-28">日付</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-16">番号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">摘要</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 w-32">借方</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 w-32">貸方</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 w-36">残高</th>
                  <th className="py-3 px-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {/* 期首残高行 */}
                <tr className="border-b border-gray-200 bg-indigo-50">
                  <td className="py-2 px-4 font-medium text-indigo-700" colSpan={2}>
                    {filterFrom ? formatDate(parseYmd(filterFrom)) : "期首"}
                  </td>
                  <td className="py-2 px-4 font-medium text-indigo-700">期首残高</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-indigo-700" colSpan={2} />
                  <td className="py-2 px-4 text-right font-mono font-medium text-indigo-700">
                    {formatCurrency(ledger.openingBalance)}
                  </td>
                  <td />
                </tr>

                {/* 明細行 */}
                {ledger.lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      期間内の明細がありません
                    </td>
                  </tr>
                ) : (
                  ledger.lines.map((line) => (
                    <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 text-gray-700">
                        {formatDate(parseYmd(line.date))}
                      </td>
                      <td className="py-2 px-4">
                        <span className="font-mono text-xs text-gray-500">
                          #{line.entryNumber}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-800">{line.description}</td>
                      <td className="py-2 px-4 text-right font-mono">
                        {line.debit > 0 ? formatCurrency(line.debit) : ""}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {line.credit > 0 ? formatCurrency(line.credit) : ""}
                      </td>
                      <td className={`py-2 px-4 text-right font-mono font-medium ${line.balance < 0 ? "text-red-600" : ""}`}>
                        {formatCurrency(Math.abs(line.balance))}
                        {line.balance < 0 && (
                          <span className="text-xs text-red-500 ml-1">△</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <Link href={`/journal-entries/${line.entryId}/edit`}>
                          <Button variant="ghost" size="sm">
                            仕訳
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
