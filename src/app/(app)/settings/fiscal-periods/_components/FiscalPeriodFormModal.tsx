"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/client-fetch";
import type { FiscalPeriod } from "@/types/master";

type FiscalPeriodFormData = {
  name: string;
  startDate: string;
  endDate: string;
};

type FiscalPeriodFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTarget?: FiscalPeriod | null;
};

const initialForm: FiscalPeriodFormData = {
  name: "",
  startDate: "",
  endDate: "",
};

export function FiscalPeriodFormModal({
  open,
  onClose,
  onSuccess,
  editTarget,
}: FiscalPeriodFormModalProps) {
  const [form, setForm] = useState<FiscalPeriodFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FiscalPeriodFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editTarget) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          name: editTarget.name,
          startDate: editTarget.startDate,
          endDate: editTarget.endDate,
        });
      } else {
        setForm(initialForm);
      }
      setErrors({});
      setServerError(null);
    }
  }, [open, editTarget]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FiscalPeriodFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "名称は必須です";
    if (!form.startDate) newErrors.startDate = "開始日は必須です";
    if (!form.endDate) newErrors.endDate = "終了日は必須です";
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      newErrors.endDate = "終了日は開始日以降の日付を入力してください";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setServerError(null);

    try {
      const payload = {
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      };

      if (editTarget) {
        await apiFetch<FiscalPeriod>(`/api/master/fiscal-periods/${editTarget.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<FiscalPeriod>("/api/master/fiscal-periods", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTarget ? "会計期間を編集" : "会計期間を作成"}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSubmit} loading={saving}>
            {editTarget ? "更新" : "作成"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {serverError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
        )}

        <Input
          label="名称 *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
          placeholder="2026年度"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="開始日 *"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            error={errors.startDate}
          />
          <Input
            label="終了日 *"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            error={errors.endDate}
          />
        </div>
      </div>
    </Modal>
  );
}
