"use client";

import { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/client-fetch";
import { PartnerTable } from "./_components/PartnerTable";
import { PartnerFormModal } from "./_components/PartnerFormModal";
import { PartnerFilterBar } from "./_components/PartnerFilterBar";
import type { Partner } from "@/types/master";

export default function PartnersPage() {
  const { showToast } = useToast();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルタ状態
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [active, setActive] = useState("");

  // モーダル状態
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);

  // 削除確認ダイアログ状態
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      if (active) params.set("active", active);
      const url = `/api/master/partners${params.toString() ? `?${params}` : ""}`;
      const data = await apiFetch<Partner[]>(url);
      setPartners(data);
    } catch {
      showToast("error", "取引先の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [q, type, active, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPartners();
  }, [fetchPartners]);

  const handleFilterChange = (filters: { q?: string; type?: string; active?: string }) => {
    if (filters.q !== undefined) setQ(filters.q);
    if (filters.type !== undefined) setType(filters.type);
    if (filters.active !== undefined) setActive(filters.active);
  };

  const handleEdit = (partner: Partner) => {
    setEditTarget(partner);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    showToast("success", editTarget ? "取引先を更新しました" : "取引先を作成しました");
    fetchPartners();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/master/partners/${deleteTarget.id}`, {
        method: "DELETE",
      });
      showToast("success", "取引先を削除しました");
      setDeleteTarget(null);
      fetchPartners();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "削除に失敗しました";
      // 409エラーの場合は無効化を案内
      if (msg.includes("使用中")) {
        showToast(
          "error",
          "この取引先は仕訳で使用中のため削除できません。「編集」から無効化（有効をオフ）してください。"
        );
      } else {
        showToast("error", msg);
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="取引先管理"
        description="取引先（顧客・仕入先）を管理します"
        action={
          <Button onClick={handleCreate}>新規作成</Button>
        }
      />

      <Card>
        <div className="space-y-4">
          <PartnerFilterBar
            q={q}
            type={type}
            active={active}
            onChange={handleFilterChange}
          />

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">読み込み中...</div>
          ) : (
            <PartnerTable
              partners={partners}
              onEdit={handleEdit}
              onDelete={(partner) => setDeleteTarget(partner)}
            />
          )}
        </div>
      </Card>

      <PartnerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        editTarget={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="取引先を削除"
        message={`「${deleteTarget?.name}」を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        loading={deleting}
      />
    </div>
  );
}
