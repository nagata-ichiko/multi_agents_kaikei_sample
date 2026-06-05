type LineInput = {
  debit: number;
  credit: number;
};

/**
 * 貸借一致チェック（Σdebit === Σcredit）
 * 一致しない場合は { valid: false, diff: number }
 */
export function checkBalance(lines: LineInput[]): {
  valid: boolean;
  totalDebit: number;
  totalCredit: number;
  diff: number;
} {
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const diff = totalDebit - totalCredit;
  return { valid: diff === 0, totalDebit, totalCredit, diff };
}

export type { LineInput as JournalLineForBalance };
