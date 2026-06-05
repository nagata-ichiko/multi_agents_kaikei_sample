"use client";

import { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/client-fetch";
import { FiscalPeriodTable } from "./_components/FiscalPeriodTable";
import { FiscalPeriodFormModal } from "./_components/FiscalPeriodFormModal";
import type { FiscalPeriod } from "@/types/master";

export default function FiscalPeriodsPage() {
  const { showToast } = useToast();

  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  // モーダル状態
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FiscalPeriod | null>(null);

  // 削除確認ダイアログ状態
  const [deleteTarget, setDeleteTarget] = useState<FiscalPeriod | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 締め切り確認ダイアログ状態
  const [closeTarget, setCloseTarget] = useState<FiscalPeriod | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<FiscalPeriod[]>("/api/master/fiscal-periods");
      setPeriods(data);
    } catch {
      showToast("error", "会計期間の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPeriods();
  }, [fetchPeriods]);

  const handleCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (period: FiscalPeriod) => {
    setEditTarget(period);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    showToast("success", editTarget ? "会計期間を更新しました" : "会計期間を作成しました");
    fetchPeriods();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/master/fiscal-periods/${deleteTarget.id}`, {
        method: "DELETE",
      });
      showToast("success", "会計期間を削除しました");
      setDeleteTarget(null);
      fetchPeriods();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "削除に失敗しました";
      showToast("error", msg);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleClosed = (period: FiscalPeriod) => {
    setCloseTarget(period);
  };

  const handleToggleClosedConfirm = async () => {
    if (!closeTarget) return;
    setTogglingId(closeTarget.id);
    try {
      await apiFetch<FiscalPeriod>(`/api/master/fiscal-periods/${closeTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isClosed: !closeTarget.isClosed }),
      });
      showToast(
        "success",
        closeTarget.isClosed ? "締めを解除しました" : "締め処理を行いました"
      );
      setCloseTarget(null);
      fetchPeriods();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "更新に失敗しました";
      showToast("error", msg);
      setCloseTarget(null);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="会計期間設定"
        description="会計期間を管理します"
        action={
          <Button onClick={handleCreate}>新規作成</Button>
        }
      />

      <Card>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">読み込み中...</div>
        ) : (
          <FiscalPeriodTable
            periods={periods}
            onEdit={handleEdit}
            onDelete={(period) => setDeleteTarget(period)}
            onToggleClosed={handleToggleClosed}
            togglingId={togglingId}
          />
        )}
      </Card>

      <FiscalPeriodFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        editTarget={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="会計期間を削除"
        message={`「${deleteTarget?.name}」を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        loading={deleting}
      />

      <ConfirmDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleToggleClosedConfirm}
        title={closeTarget?.isClosed ? "締めを解除" : "締め処理"}
        message={
          closeTarget?.isClosed
            ? `「${closeTarget?.name}」の締めを解除しますか？解除後はこの期間の仕訳を変更できます。`
            : `「${closeTarget?.name}」を締めますか？締め後はこの期間の仕訳を変更できなくなります。`
        }
        confirmLabel={closeTarget?.isClosed ? "解除" : "締める"}
        loading={!!togglingId}
      />
    </div>
  );
}
