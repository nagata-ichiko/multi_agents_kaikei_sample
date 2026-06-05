"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { apiFetch } from "@/lib/client-fetch";
import type { Partner, PartnerType } from "@/types/master";

type PartnerFormData = {
  code: string;
  name: string;
  kana: string;
  type: PartnerType;
  email: string;
  phone: string;
  address: string;
  note: string;
  isActive: boolean;
};

type PartnerFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTarget?: Partner | null;
};

const initialForm: PartnerFormData = {
  code: "",
  name: "",
  kana: "",
  type: "CUSTOMER",
  email: "",
  phone: "",
  address: "",
  note: "",
  isActive: true,
};

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  CUSTOMER: "顧客",
  VENDOR: "仕入先",
  BOTH: "両方",
};

export function PartnerFormModal({
  open,
  onClose,
  onSuccess,
  editTarget,
}: PartnerFormModalProps) {
  const [form, setForm] = useState<PartnerFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof PartnerFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editTarget) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          code: editTarget.code,
          name: editTarget.name,
          kana: editTarget.kana ?? "",
          type: editTarget.type,
          email: editTarget.email ?? "",
          phone: editTarget.phone ?? "",
          address: editTarget.address ?? "",
          note: editTarget.note ?? "",
          isActive: editTarget.isActive,
        });
      } else {
        setForm(initialForm);
      }
      setErrors({});
      setServerError(null);
    }
  }, [open, editTarget]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PartnerFormData, string>> = {};
    if (!form.code.trim()) newErrors.code = "取引先コードは必須です";
    if (!form.name.trim()) newErrors.name = "名称は必須です";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setServerError(null);

    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        kana: form.kana.trim() || null,
        type: form.type,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        note: form.note.trim() || null,
        ...(editTarget ? { isActive: form.isActive } : {}),
      };

      if (editTarget) {
        await apiFetch<Partner>(`/api/master/partners/${editTarget.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<Partner>("/api/master/partners", {
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
      title={editTarget ? "取引先を編集" : "取引先を作成"}
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

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="取引先コード *"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            error={errors.code}
            placeholder="C001"
          />
          <Select
            label="種別 *"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartnerType }))}
          >
            {(["CUSTOMER", "VENDOR", "BOTH"] as PartnerType[]).map((t) => (
              <option key={t} value={t}>{PARTNER_TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </div>

        <Input
          label="名称 *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
          placeholder="株式会社サンプル"
        />

        <Input
          label="カナ"
          value={form.kana}
          onChange={(e) => setForm((f) => ({ ...f, kana: e.target.value }))}
          placeholder="カブシキガイシャサンプル"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="メールアドレス"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="info@example.com"
          />
          <Input
            label="電話番号"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="03-1234-5678"
          />
        </div>

        <Input
          label="住所"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="東京都千代田区..."
        />

        <Textarea
          label="備考"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          rows={2}
          placeholder="備考を入力"
        />

        {editTarget && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">有効</label>
          </div>
        )}
      </div>
    </Modal>
  );
}
