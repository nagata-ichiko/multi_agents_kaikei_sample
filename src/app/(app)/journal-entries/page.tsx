"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/client-fetch";
import { formatCurrency, formatDate, parseYmd } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { JournalEntry, Account } from "@/types/ledger";
import type { Partner } from "@/types/master";

type ListResponse = {
  data: JournalEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function JournalEntriesPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // フィルタ
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterPartnerId, setFilterPartnerId] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [page, setPage] = useState(1);

  // マスタ
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // 削除確認
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<Account[]>("/api/ledger/accounts").then(setAccounts).catch(() => {});
    apiFetch<Partner[]>("/api/master/partners").then(setPartners).catch(() => {});
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      if (filterAccountId) params.set("accountId", filterAccountId);
      if (filterPartnerId) params.set("partnerId", filterPartnerId);
      if (filterQ) params.set("q", filterQ);
      params.set("page", String(page));
      params.set("limit", "20");

      const result = await apiFetch<ListResponse>(
        `/api/ledger/journal-entries?${params}`
      );
      setEntries(result.data);
      setPagination({
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
        total: result.pagination.total,
      });
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [filterFrom, filterTo, filterAccountId, filterPartnerId, filterQ, page, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/ledger/journal-entries/${deleteTarget.id}`, {
        method: "DELETE",
      });
      showToast("success", "仕訳を削除しました");
      setDeleteTarget(null);
      fetchEntries();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "削除に失敗しました");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const getPartnerName = (partnerId: string | null) => {
    if (!partnerId) return "";
    return partners.find((p) => p.id === partnerId)?.name ?? "";
  };

  const columns: Column<JournalEntry>[] = [
    {
      key: "entryNumber",
      header: "仕訳番号",
      render: (row) => (
        <span className="font-mono text-xs text-gray-500">
          #{row.entryNumber}
        </span>
      ),
    },
    {
      key: "date",
      header: "日付",
      render: (row) => formatDate(parseYmd(row.date)),
    },
    { key: "description", header: "摘要" },
    {
      key: "status",
      header: "ステータス",
      render: (row) =>
        row.status === "POSTED" ? (
          <Badge variant="green">確定</Badge>
        ) : (
          <Badge variant="amber">下書き</Badge>
        ),
    },
    {
      key: "amount",
      header: "金額（借方）",
      align: "right",
      render: (row) => {
        const total = row.lines.reduce((s, l) => s + l.debit, 0);
        return <span className="font-mono">{formatCurrency(total)}</span>;
      },
    },
    {
      key: "partner",
      header: "取引先",
      render: (row) => getPartnerName(row.partnerId),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Link href={`/journal-entries/${row.id}/edit`}>
            <Button variant="ghost" size="sm">
              編集
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget(row)}
          >
            削除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="仕訳一覧"
        description="登録済みの仕訳を確認・管理します"
        action={
          <Link href="/journal-entries/new">
            <Button>新規入力</Button>
          </Link>
        }
      />

      {/* フィルタ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <Input
              label="期間（開始）"
              type="date"
              value={filterFrom}
              onChange={(e) => {
                setFilterFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Input
              label="期間（終了）"
              type="date"
              value={filterTo}
              onChange={(e) => {
                setFilterTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-44">
            <Select
              label="勘定科目"
              value={filterAccountId}
              onChange={(e) => {
                setFilterAccountId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全て</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select
              label="取引先"
              value={filterPartnerId}
              onChange={(e) => {
                setFilterPartnerId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全て</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1 min-w-48">
            <Input
              label="フリーワード"
              value={filterQ}
              onChange={(e) => {
                setFilterQ(e.target.value);
                setPage(1);
              }}
              placeholder="摘要で検索"
            />
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : entries.length === 0 ? (
          <EmptyState
            message="仕訳がありません"
            description="新規入力ボタンから仕訳を登録してください"
            action={
              <Link href="/journal-entries/new">
                <Button>新規入力</Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={entries}
              keyExtractor={(r) => r.id}
            />
            <div className="p-4 border-t border-gray-100">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="仕訳の削除"
        message={`仕訳番号 #${deleteTarget?.entryNumber}「${deleteTarget?.description}」を削除しますか？`}
        confirmLabel="削除"
        loading={deleting}
      />
    </div>
  );
}
