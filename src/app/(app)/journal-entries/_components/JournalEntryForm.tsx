"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/client-fetch";
import { formatCurrency } from "@/lib/format";
import type { Account, JournalEntry, JournalEntryInput } from "@/types/ledger";
import type { Partner } from "@/types/master";

type LineForm = {
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
};

const emptyLine = (): LineForm => ({
  accountId: "",
  debit: "",
  credit: "",
  memo: "",
});

type Props = {
  initialEntry?: JournalEntry;
};

export function JournalEntryForm({ initialEntry }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = !!initialEntry;

  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "POSTED">("POSTED");
  const [partnerId, setPartnerId] = useState("");
  const [lines, setLines] = useState<LineForm[]>([emptyLine(), emptyLine()]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // マスタデータ
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    // アクティブな勘定科目のみ取得
    apiFetch<Account[]>("/api/ledger/accounts?active=true").then(setAccounts).catch(() => {});
    apiFetch<Partner[]>("/api/master/partners?active=true").then(setPartners).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialEntry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(initialEntry.date);
      setDescription(initialEntry.description);
      setStatus(initialEntry.status);
      setPartnerId(initialEntry.partnerId ?? "");
      setLines(
        initialEntry.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit > 0 ? String(l.debit) : "",
          credit: l.credit > 0 ? String(l.credit) : "",
          memo: l.memo ?? "",
        }))
      );
    }
  }, [initialEntry]);

  const totalDebit = lines.reduce(
    (sum, l) => sum + (parseInt(l.debit || "0", 10) || 0),
    0
  );
  const totalCredit = lines.reduce(
    (sum, l) => sum + (parseInt(l.credit || "0", 10) || 0),
    0
  );
  const diff = totalDebit - totalCredit;
  const balanced = diff === 0 && totalDebit > 0;

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const updateLine = (
    idx: number,
    field: keyof LineForm,
    value: string
  ) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!date) errs.date = "日付は必須です";
    if (!description.trim()) errs.description = "摘要は必須です";
    if (lines.length < 2) errs.lines = "明細は2行以上必要です";

    let linesValid = true;
    lines.forEach((l, i) => {
      if (!l.accountId) {
        errs[`line_${i}_account`] = "科目を選択してください";
        linesValid = false;
      }
      const d = parseInt(l.debit || "0", 10) || 0;
      const c = parseInt(l.credit || "0", 10) || 0;
      if (d > 0 && c > 0) {
        errs[`line_${i}_amount`] = "借方・貸方は同時に入力できません";
        linesValid = false;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0 && linesValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!balanced) {
      showToast("error", "貸借が一致していません");
      return;
    }

    setLoading(true);
    try {
      const payload: JournalEntryInput = {
        date,
        description,
        status,
        partnerId: partnerId || null,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: parseInt(l.debit || "0", 10) || 0,
          credit: parseInt(l.credit || "0", 10) || 0,
          memo: l.memo || undefined,
        })),
      };

      if (isEdit && initialEntry) {
        await apiFetch(`/api/ledger/journal-entries/${initialEntry.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showToast("success", "仕訳を更新しました");
      } else {
        await apiFetch("/api/ledger/journal-entries", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("success", "仕訳を保存しました");
      }
      router.push("/journal-entries");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="日付"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
          <div className="sm:col-span-2">
            <Input
              label="摘要"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              placeholder="取引の内容"
            />
          </div>
          <Select
            label="ステータス"
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "POSTED")}
          >
            <option value="POSTED">確定（POSTED）</option>
            <option value="DRAFT">下書き（DRAFT）</option>
          </Select>
          <div className="sm:col-span-2 lg:col-span-2">
            <Select
              label="取引先（任意）"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            >
              <option value="">なし</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* 明細行 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">明細行</h2>
          <Button variant="secondary" size="sm" onClick={addLine}>
            行を追加
          </Button>
        </div>

        {errors.lines && (
          <p className="text-sm text-red-600 mb-2">{errors.lines}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-3 font-medium text-gray-600 w-1/3">
                  勘定科目
                </th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 w-1/5">
                  借方
                </th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 w-1/5">
                  貸方
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">
                  摘要
                </th>
                <th className="py-2 pl-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 pr-3">
                    <select
                      value={line.accountId}
                      onChange={(e) =>
                        updateLine(idx, "accountId", e.target.value)
                      }
                      className={`w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors[`line_${idx}_account`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">科目を選択</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} {a.name}
                        </option>
                      ))}
                    </select>
                    {errors[`line_${idx}_account`] && (
                      <p className="text-xs text-red-600 mt-0.5">
                        {errors[`line_${idx}_account`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={line.debit}
                      onChange={(e) =>
                        updateLine(idx, "debit", e.target.value)
                      }
                      className={`w-full rounded-md border px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors[`line_${idx}_amount`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="0"
                    />
                    {errors[`line_${idx}_amount`] && (
                      <p className="text-xs text-red-600 mt-0.5 text-right">
                        {errors[`line_${idx}_amount`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={line.credit}
                      onChange={(e) =>
                        updateLine(idx, "credit", e.target.value)
                      }
                      className={`w-full rounded-md border px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors[`line_${idx}_amount`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={line.memo}
                      onChange={(e) =>
                        updateLine(idx, "memo", e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="摘要（任意）"
                    />
                  </td>
                  <td className="py-2 pl-3">
                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="行を削除"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-2 pr-3 text-sm text-gray-700">合計</td>
                <td className="py-2 px-3 text-right text-sm">
                  {formatCurrency(totalDebit)}
                </td>
                <td className="py-2 px-3 text-right text-sm">
                  {formatCurrency(totalCredit)}
                </td>
                <td colSpan={2} className="py-2 px-3">
                  {diff !== 0 && (
                    <span className="text-red-600 text-xs">
                      差額: {formatCurrency(Math.abs(diff))}{" "}
                      {diff > 0 ? "（借方超過）" : "（貸方超過）"}
                    </span>
                  )}
                  {balanced && (
                    <span className="text-green-600 text-xs">貸借一致</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* アクション */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push("/journal-entries")}
          disabled={loading}
        >
          キャンセル
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={!balanced}>
          {isEdit ? "更新" : "保存"}
        </Button>
      </div>
    </div>
  );
}
