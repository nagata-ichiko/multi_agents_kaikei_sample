import { describe, it, expect } from "vitest";
import { isOverlapping, hasOverlapWithExisting } from "./fiscal-period-overlap";

describe("isOverlapping", () => {
  it("重複しない（前後に隣接）", () => {
    expect(
      isOverlapping(
        { startDate: "2026-01-01", endDate: "2026-03-31" },
        { startDate: "2026-04-01", endDate: "2026-06-30" }
      )
    ).toBe(false);
  });

  it("1日だけ重複する（終了日と開始日が同じ）", () => {
    expect(
      isOverlapping(
        { startDate: "2026-01-01", endDate: "2026-03-31" },
        { startDate: "2026-03-31", endDate: "2026-06-30" }
      )
    ).toBe(true);
  });

  it("完全に重複する", () => {
    expect(
      isOverlapping(
        { startDate: "2026-01-01", endDate: "2026-12-31" },
        { startDate: "2026-04-01", endDate: "2026-09-30" }
      )
    ).toBe(true);
  });

  it("一方が他方を包含する", () => {
    expect(
      isOverlapping(
        { startDate: "2025-01-01", endDate: "2027-12-31" },
        { startDate: "2026-01-01", endDate: "2026-12-31" }
      )
    ).toBe(true);
  });

  it("完全に前に存在する（重複なし）", () => {
    expect(
      isOverlapping(
        { startDate: "2024-01-01", endDate: "2024-12-31" },
        { startDate: "2026-01-01", endDate: "2026-12-31" }
      )
    ).toBe(false);
  });

  it("同じ期間は重複する", () => {
    expect(
      isOverlapping(
        { startDate: "2026-01-01", endDate: "2026-12-31" },
        { startDate: "2026-01-01", endDate: "2026-12-31" }
      )
    ).toBe(true);
  });
});

describe("hasOverlapWithExisting", () => {
  const existingPeriods = [
    { id: "fp1", startDate: "2024-04-01", endDate: "2025-03-31" },
    { id: "fp2", startDate: "2025-04-01", endDate: "2026-03-31" },
    { id: "fp3", startDate: "2026-04-01", endDate: "2027-03-31" },
  ];

  it("既存期間と重複しない場合はfalseを返す", () => {
    expect(
      hasOverlapWithExisting(
        { startDate: "2027-04-01", endDate: "2028-03-31" },
        existingPeriods
      )
    ).toBe(false);
  });

  it("既存期間と重複する場合はtrueを返す", () => {
    expect(
      hasOverlapWithExisting(
        { startDate: "2026-01-01", endDate: "2026-06-30" },
        existingPeriods
      )
    ).toBe(true);
  });

  it("excludeIdの期間は重複チェックから除外される", () => {
    // fp2 を更新する場合、同じ期間でもexcludeIdで除外されるので重複なし
    expect(
      hasOverlapWithExisting(
        { startDate: "2025-04-01", endDate: "2026-03-31" },
        existingPeriods,
        "fp2"
      )
    ).toBe(false);
  });

  it("excludeId指定でも他の期間との重複はtrueを返す", () => {
    // fp2を更新しようとしているが、fp3と重複する日付
    expect(
      hasOverlapWithExisting(
        { startDate: "2026-01-01", endDate: "2026-06-30" },
        existingPeriods,
        "fp2"
      )
    ).toBe(true);
  });

  it("空のリストは常にfalseを返す", () => {
    expect(
      hasOverlapWithExisting(
        { startDate: "2026-01-01", endDate: "2026-12-31" },
        []
      )
    ).toBe(false);
  });
});
