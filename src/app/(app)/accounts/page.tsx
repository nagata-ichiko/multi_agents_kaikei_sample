"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/client-fetch";
import { useToast } from "@/components/ui/Toast";
import type { Account, AccountType } from "@/types/ledger";
import { AccountModal } from "./_components/AccountModal";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "資産",
  LIABILITY: "負債",
  EQUITY: "純資産",
  REVENUE: "収益",
  EXPENSE: "費用",
};

export default function AccountsPage() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルタ
  const [filterType, setFilterType] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterQ, setFilterQ] = useState("");

  // モーダル
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  // 削除確認
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterActive) params.set("active", filterActive);
      if (filterQ) params.set("q", filterQ);
      const data = await apiFetch<Account[]>(`/api/ledger/accounts?${params}`);
      setAccounts(data);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterActive, filterQ, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/ledger/accounts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      showToast("success", "勘定科目を削除しました");
      setDeleteTarget(null);
      fetchAccounts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "削除に失敗しました";
      if (msg.includes("使用されているため削除できません")) {
        showToast("error", "この科目は仕訳で使用中です。代わりに無効化してください");
      } else {
        showToast("error", msg);
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Account>[] = [
    { key: "code", header: "科目コード", render: (row) => <span className="font-mono">{row.code}</span> },
    { key: "name", header: "科目名" },
    {
      key: "type",
      header: "区分",
      render: (row) => (
        <Badge variant="blue">{ACCOUNT_TYPE_LABELS[row.type]}</Badge>
      ),
    },
    {
      key: "isActive",
      header: "状態",
      render: (row) =>
        row.isActive ? (
          <Badge variant="green">有効</Badge>
        ) : (
          <Badge variant="gray">無効</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditAccount(row);
              setModalOpen(true);
            }}
          >
            編集
          </Button>
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
        title="勘定科目管理"
        description="科目の作成・編集・削除を管理します"
        action={
          <Button
            onClick={() => {
              setEditAccount(null);
              setModalOpen(true);
            }}
          >
            新規作成
          </Button>
        }
      />

      {/* フィルタ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <Select
              label="科目区分"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">全て</option>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <Select
              label="状態"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="">全て</option>
              <option value="true">有効</option>
              <option value="false">無効</option>
            </Select>
          </div>
          <div className="flex-1 min-w-48">
            <Input
              label="キーワード検索"
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="科目コード・科目名"
            />
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : accounts.length === 0 ? (
          <EmptyState
            message="勘定科目がありません"
            description="新規作成ボタンから科目を追加してください"
            action={
              <Button
                onClick={() => {
                  setEditAccount(null);
                  setModalOpen(true);
                }}
              >
                新規作成
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            rows={accounts}
            keyExtractor={(r) => r.id}
          />
        )}
      </div>

      <AccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAccounts}
        account={editAccount}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="勘定科目の削除"
        message={`「${deleteTarget?.name}」を削除しますか？仕訳で使用中の場合は削除できません。`}
        confirmLabel="削除"
        loading={deleting}
      />
    </div>
  );
}
