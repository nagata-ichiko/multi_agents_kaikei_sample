# REQ-LEDGER-002 勘定科目管理

<!-- review:pending id=r-20260605-003 -->

## 概要

複式簿記で使用する勘定科目の CRUD を管理する。科目は資産・負債・純資産・収益・費用の5区分に分類する。仕訳明細で使用中の科目は削除できず、代わりに isActive=false への変更を推奨する。

## 関連 Spec

- [REQ-LEDGER-001](./REQ-LEDGER-001.md): 仕訳入力（科目選択に使用）
- [REQ-LEDGER-003](./REQ-LEDGER-003.md): 総勘定元帳（科目でフィルタ）
- [REQ-REPORT-001](./REQ-REPORT-001.md): 試算表（科目別集計）

## アクター

- 経理担当者: 勘定科目を作成・編集・削除する

## 機能要件

### 勘定科目一覧

勘定科目管理画面（`/accounts`）で勘定科目を一覧表示する。

- フィルタ: 科目区分（type）、有効/無効（active）、フリーワード（q）
- 表示項目: 科目コード、科目名、区分、有効/無効

**受入条件:**

- [ ] 勘定科目一覧が表示される（`GET /api/ledger/accounts`）
- [ ] 区分・有効状態・フリーワードでフィルタできる

### 勘定科目作成

新規勘定科目を作成する。

- 入力項目: 科目コード（一意）、科目名、区分（ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE）、説明（任意）
- 科目コードの重複は許可しない

**受入条件:**

- [ ] 科目コード・科目名・区分を入力して保存できる
- [ ] 科目コードが重複する場合はエラーになる
- [ ] 区分は5種類（ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE）から選択する

### 勘定科目更新

既存の勘定科目を更新する（`PATCH /api/ledger/accounts/[id]`）。

- 科目コード・科目名・区分・説明・isActive を変更できる

**受入条件:**

- [ ] 科目名・説明・isActive を変更して保存できる
- [ ] isActive=false に変更した科目は仕訳入力の科目選択に表示されない

### 勘定科目削除

勘定科目を削除する（`DELETE /api/ledger/accounts/[id]`）。

- 仕訳明細（JournalLine）で使用中の科目は削除できない（409 エラー）
- 削除できない場合は isActive=false への変更を案内する

**受入条件:**

- [ ] 使用されていない科目は削除できる
- [ ] 仕訳明細で使用中の科目を削除しようとすると 409 エラーになる
- [ ] 409 エラー時に「isActive=false への変更」を案内するメッセージが表示される

## 画面

| パス | 主要UI要素 |
|------|----------|
| `/accounts` | 勘定科目テーブル（コード・名称・区分・有効状態）、フィルタ、新規作成ボタン、各行の編集・削除ボタン |

## API

（出典: `interfaces/ledger_interface.md`）

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/ledger/accounts | 勘定科目一覧（?type=&active=&q=） |
| POST | /api/ledger/accounts | 勘定科目作成 |
| GET | /api/ledger/accounts/[id] | 勘定科目取得 |
| PATCH | /api/ledger/accounts/[id] | 勘定科目更新 |
| DELETE | /api/ledger/accounts/[id] | 勘定科目削除（仕訳明細で使用中なら 409、代わりに isActive=false を推奨） |

**型定義（抜粋）:**

```typescript
// interfaces/ledger_interface.md より
type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

type Account = {
  id: string;
  code: string;        // 科目コード（例: "101"）一意
  name: string;
  type: AccountType;
  description: string | null;
  isActive: boolean;
};
```

## ビジネスルール

- 科目コードは一意（重複不可）
- 区分は ASSET（資産）/ LIABILITY（負債）/ EQUITY（純資産）/ REVENUE（収益）/ EXPENSE（費用）の5種類
- 仕訳明細で使用中の科目は削除不可（409）。代替として isActive=false を推奨
- isActive=false の科目は仕訳入力の科目選択に表示しない

## 受入条件（機能全体）

- [ ] 科目を新規作成し、一覧に表示されることを確認できる
- [ ] 科目を編集して変更が反映される
- [ ] 使用中科目の削除が 409 エラーになり、案内メッセージが表示される
- [ ] isActive=false の科目は仕訳入力の科目選択に表示されない

## 関連設計書

- API仕様: [design/api-spec.md](../../design/api-spec.md)
- DB設計: [design/db-design.md](../../design/db-design.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2026-06-05 | 初版作成 |

<!-- /review -->
