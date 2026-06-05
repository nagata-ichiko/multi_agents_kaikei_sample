# REQ-MASTER-001 取引先管理

<!-- review:pending id=r-20260605-008 -->

## 概要

仕訳に紐付ける取引先（顧客・仕入先・両方）を CRUD 管理する。取引先コードは一意。仕訳で使用中の取引先は削除できない（409）。

## 関連 Spec

- [REQ-LEDGER-001](./REQ-LEDGER-001.md): 仕訳入力（取引先紐付けに使用）

## アクター

- 経理担当者: 取引先を作成・編集・削除する

## 機能要件

### 取引先一覧

取引先管理画面（`/partners`）で取引先を一覧表示する。

- フィルタ: 種別（type: CUSTOMER/VENDOR/BOTH）、有効/無効（active）、フリーワード（q）
- 表示項目: 取引先コード、名称、種別、有効/無効

**受入条件:**

- [ ] 取引先一覧が表示される（`GET /api/master/partners`）
- [ ] 種別・有効状態・フリーワードでフィルタできる

### 取引先作成

新規取引先を作成する（`POST /api/master/partners`）。

- 入力項目: 取引先コード（一意）、名称、カナ（任意）、種別（CUSTOMER/VENDOR/BOTH）、メール（任意）、電話番号（任意）、住所（任意）、備考（任意）
- 取引先コードの重複は許可しない

**受入条件:**

- [ ] 取引先コード・名称・種別を入力して保存できる
- [ ] 取引先コードが重複する場合はエラーになる
- [ ] 種別は CUSTOMER / VENDOR / BOTH の3種類から選択する

### 取引先更新

既存の取引先を更新する（`PATCH /api/master/partners/[id]`）。

- 全フィールドを変更できる（isActive を含む）

**受入条件:**

- [ ] 取引先の各フィールドを編集して保存できる
- [ ] isActive=false に変更した取引先は仕訳入力の取引先選択に表示されない

### 取引先削除

取引先を削除する（`DELETE /api/master/partners/[id]`）。

- 仕訳（JournalEntry）で使用中の取引先は削除できない（409）

**受入条件:**

- [ ] 使用されていない取引先は削除できる
- [ ] 仕訳で使用中の取引先を削除しようとすると 409 エラーになる

## 画面

| パス | 主要UI要素 |
|------|----------|
| `/partners` | 取引先テーブル（コード・名称・種別・有効状態）、フィルタ、新規作成ボタン、各行の編集・削除ボタン、作成/編集モーダルまたは別画面 |

## API

（出典: `interfaces/master_interface.md`）

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/master/partners | 取引先一覧（?type=&active=&q=） |
| POST | /api/master/partners | 取引先作成 |
| GET | /api/master/partners/[id] | 取引先取得 |
| PATCH | /api/master/partners/[id] | 取引先更新 |
| DELETE | /api/master/partners/[id] | 取引先削除（仕訳で使用中なら 409） |

**型定義（抜粋）:**

```typescript
// interfaces/master_interface.md より
type PartnerType = "CUSTOMER" | "VENDOR" | "BOTH";

type Partner = {
  id: string;
  code: string;
  name: string;
  kana: string | null;
  type: PartnerType;
  email: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
};
```

## ビジネスルール

- 取引先コードは一意（重複不可）
- 種別は CUSTOMER（顧客）/ VENDOR（仕入先）/ BOTH（両方）の3種類
- 仕訳（JournalEntry）で参照されている取引先は削除不可（409）
- isActive=false の取引先は仕訳入力の取引先選択に表示しない

## 受入条件（機能全体）

- [ ] 取引先を新規作成し、一覧に表示されることを確認できる
- [ ] 取引先を編集して変更が反映される
- [ ] 仕訳で使用中の取引先の削除が 409 エラーになる
- [ ] isActive=false の取引先は仕訳入力の選択肢に表示されない

## 関連設計書

- API仕様: [design/api-spec.md](../../design/api-spec.md)
- DB設計: [design/db-design.md](../../design/db-design.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2026-06-05 | 初版作成 |

<!-- /review -->
