# REQ-MASTER-002 会計期間設定

<!-- review:pending id=r-20260605-009 -->

## 概要

会計期間（FiscalPeriod）を CRUD 管理する。期間の重複は 422 エラー。締め処理（isClosed=true）を設定した期間の仕訳は変更不可となる。仕訳で参照されている会計期間は削除できない（409）。

## 関連 Spec

- [REQ-LEDGER-001](./REQ-LEDGER-001.md): 仕訳入力（期間判定・閉鎖チェックに使用）
- [REQ-REPORT-001](./REQ-REPORT-001.md): 試算表（期間指定）
- [REQ-REPORT-002](./REQ-REPORT-002.md): 財務諸表（期間指定）
- [REQ-REPORT-003](./REQ-REPORT-003.md): ダッシュボード（期間指定）

## アクター

- 経理担当者: 会計期間を作成・編集・削除する

## 機能要件

### 会計期間一覧

会計期間設定画面（`/settings/fiscal-periods`）で会計期間を一覧表示する。

- 表示項目: 名称、開始日、終了日、締め状態（isClosed）

**受入条件:**

- [ ] 会計期間一覧が表示される（`GET /api/master/fiscal-periods`）
- [ ] 締め済み（isClosed=true）かどうかがわかる

### 会計期間作成

新規会計期間を作成する（`POST /api/master/fiscal-periods`）。

- 入力項目: 名称（例: 2026年度）、開始日（YYYY-MM-DD）、終了日（YYYY-MM-DD）
- 既存の会計期間と期間が重複する場合は 422 エラー

**受入条件:**

- [ ] 名称・開始日・終了日を入力して保存できる
- [ ] 既存期間と重複する期間を指定した場合は 422 エラーになる

### 会計期間更新（締め処理含む）

既存の会計期間を更新する（`PATCH /api/master/fiscal-periods/[id]`）。

- 名称・開始日・終了日・isClosed を変更できる
- isClosed=true に設定すると、その期間に属する仕訳の作成・更新・削除が不可になる（判定は ledger ドメインが行う）

**受入条件:**

- [ ] 名称・開始日・終了日を変更して保存できる
- [ ] isClosed=true に変更できる（締め処理）
- [ ] isClosed=true の期間は ledger 側で仕訳変更不可となる

### 会計期間削除

会計期間を削除する（`DELETE /api/master/fiscal-periods/[id]`）。

- 仕訳（JournalEntry）が存在する会計期間は削除できない（409）

**受入条件:**

- [ ] 仕訳が存在しない会計期間は削除できる
- [ ] 仕訳が存在する会計期間を削除しようとすると 409 エラーになる

## 画面

| パス | 主要UI要素 |
|------|----------|
| `/settings/fiscal-periods` | 会計期間テーブル（名称・開始日・終了日・締め状態）、新規作成ボタン、各行の編集・削除・締め切りボタン |

## API

（出典: `interfaces/master_interface.md`）

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/master/fiscal-periods | 会計期間一覧 |
| POST | /api/master/fiscal-periods | 会計期間作成（期間重複は 422） |
| PATCH | /api/master/fiscal-periods/[id] | 会計期間更新（締め isClosed 切替含む） |
| DELETE | /api/master/fiscal-periods/[id] | 会計期間削除（仕訳が存在すれば 409） |

**型定義（抜粋）:**

```typescript
// interfaces/master_interface.md より
type FiscalPeriod = {
  id: string;
  name: string;       // 例: 2026年度
  startDate: string;  // YYYY-MM-DD
  endDate: string;
  isClosed: boolean;
};
```

## ビジネスルール

（出典: `interfaces/master_interface.md`）

- FiscalPeriod の期間（startDate〜endDate）は他期間と重複不可（422）
- isClosed=true の期間の仕訳変更は ledger 側で 422 を返す（判定は ledger が行う）
- 仕訳（JournalEntry）が存在する会計期間は削除不可（409）

## 受入条件（機能全体）

- [ ] 会計期間を新規作成し、一覧に表示されることを確認できる
- [ ] 重複する期間の作成が 422 エラーになる
- [ ] isClosed=true に設定した後、その期間の仕訳が変更不可になる
- [ ] 仕訳が存在する期間の削除が 409 エラーになる

## 関連設計書

- API仕様: [design/api-spec.md](../../design/api-spec.md)
- DB設計: [design/db-design.md](../../design/db-design.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2026-06-05 | 初版作成 |

<!-- /review -->
