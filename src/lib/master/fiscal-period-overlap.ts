/**
 * 会計期間の重複チェックユーティリティ
 *
 * 期間の重複とは、既存期間の [startDate, endDate] と
 * 新しい期間の [startDate, endDate] が1日でも重なることを指す。
 */

export type PeriodRange = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
};

/**
 * 2つの期間が重複しているかどうかを判定する
 * 重複の条件: startA <= endB && startB <= endA
 */
export function isOverlapping(a: PeriodRange, b: PeriodRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/**
 * 新しい期間が既存の期間リストと重複するかチェックする
 * @param newPeriod 追加/更新しようとしている期間
 * @param existingPeriods 既存の期間リスト
 * @param excludeId 更新時に除外するID（自分自身との重複チェックを避けるため）
 * @returns 重複している場合は true
 */
export function hasOverlapWithExisting(
  newPeriod: PeriodRange,
  existingPeriods: (PeriodRange & { id: string })[],
  excludeId?: string
): boolean {
  return existingPeriods
    .filter((p) => p.id !== excludeId)
    .some((p) => isOverlapping(newPeriod, p));
}
