"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/client-fetch";
import { useToast } from "@/components/ui/Toast";
import type { JournalEntry } from "@/types/ledger";
import { JournalEntryForm } from "../../_components/JournalEntryForm";

export default function EditJournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<JournalEntry>(`/api/ledger/journal-entries/${id}`)
      .then(setEntry)
      .catch(() => {
        showToast("error", "仕訳が見つかりません");
        router.push("/journal-entries");
      })
      .finally(() => setLoading(false));
  }, [id, router, showToast]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/ledger/journal-entries/${id}`, {
        method: "DELETE",
      });
      showToast("success", "仕訳を削除しました");
      router.push("/journal-entries");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "削除に失敗しました");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">読み込み中...</div>
    );
  }

  if (!entry) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title={`仕訳編集 #${entry.entryNumber}`}
          description={entry.description}
        />
        <Button
          variant="danger"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          この仕訳を削除
        </Button>
      </div>

      <JournalEntryForm initialEntry={entry} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="仕訳の削除"
        message={`仕訳番号 #${entry.entryNumber}「${entry.description}」を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        loading={deleting}
      />
    </div>
  );
}
