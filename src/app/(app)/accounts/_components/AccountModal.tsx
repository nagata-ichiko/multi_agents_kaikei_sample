"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { apiFetch } from "@/lib/client-fetch";
import { useToast } from "@/components/ui/Toast";
import type { Account } from "@/types/ledger";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: "資産",
  LIABILITY: "負債",
  EQUITY: "純資産",
  REVENUE: "収益",
  EXPENSE: "費用",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  account?: Account | null;
};

export function AccountModal({ open, onClose, onSaved, account }: Props) {
  const { showToast } = useToast();
  const isEdit = !!account;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("ASSET");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (account) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCode(account.code);
        setName(account.name);
        setType(account.type);
        setDescription(account.description ?? "");
        setIsActive(account.isActive);
      } else {
        setCode("");
        setName("");
        setType("ASSET");
        setDescription("");
        setIsActive(true);
      }
      setErrors({});
    }
  }, [open, account]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "科目コードは必須です";
    if (!name.trim()) errs.name = "科目名は必須です";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      if (isEdit && account) {
        await apiFetch(`/api/ledger/accounts/${account.id}`, {
          method: "PATCH",
          body: JSON.stringify({ code, name, type, description: description || null, isActive }),
        });
        showToast("success", "勘定科目を更新しました");
      } else {
        await apiFetch("/api/ledger/accounts", {
          method: "POST",
          body: JSON.stringify({ code, name, type, description: description || null }),
        });
        showToast("success", "勘定科目を作成しました");
      }
      onSaved();
      onClose();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "勘定科目を編集" : "勘定科目を新規作成"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="科目コード"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
          placeholder="例: 101"
        />
        <Input
          label="科目名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="例: 現金"
        />
        <Select
          label="科目区分"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </Select>
        <Textarea
          label="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="科目の説明を入力"
        />
        {isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              有効
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}
