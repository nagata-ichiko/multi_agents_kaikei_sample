# REQ-LEDGER-001 仕訳入力

<!-- review:pending id=r-20260605-002 -->

## 概要

複式簿記の仕訳を入力・編集・削除する。明細は2行以上で貸借一致を検証し、DRAFT（下書き）/ POSTED（確定）の2ステータスを管理する。取引先を紐付けることができる。isClosed=true の会計期間に属する仕訳は変更不可。

## 関連 Spec

- [REQ-LEDGER-002](./REQ-LEDGER-002.md): 勘定科目管理（科目選択に使用）
- [REQ-MASTER-001](./REQ-MASTER-001.md): 取引先管理（取引先紐付けに使用）
- [REQ-MASTER-002](./REQ-MASTER-002.md): 会計期間設定（期間判定・閉鎖チェックに使用）

## アクター

- 経理担当者: 仕訳を入力・編集・削除する

## 機能要件

### 仕訳一覧表示

仕訳一覧画面（`/journal-entries`）で、登録済み仕訳を一覧表示する。

- 検索フィルタ: 期間（from/to）、勘定科目（accountId）、取引先（partnerId）、フリーワード（q）
- ページネーション: page/limit パラメータ対応
- 表示項目: 仕訳番号（entryNumber）、日付、摘要、ステータス（DRAFT/POSTED）、取引先名

**受入条件:**

- [ ] 仕訳一覧が表示される（`GET /api/ledger/journal-entries`）
- [ ] 期間・科目・取引先・フリーワードでフィルタできる
- [ ] ページネーションが機能する

### 仕訳入力

仕訳入力画面（`/journal-entries/new`）で新規仕訳を作成する。

- 入力項目: 日付、摘要、ステータス（DRAFT/POSTED）、取引先（任意）、明細行（科目・借方・貸方・摘要）
- 明細は2行以上必須
- 各明細は借方と貸方のどちらか一方のみ正の整数を入力する（debit XOR credit）
- 保存前に Σdebit === Σcredit の貸借一致を検証する
- 仕訳日付は登録先会計期間（FiscalPeriod）の期間内であること

**受入条件:**

- [ ] 明細が1行以下の場合は保存できない（バリデーションエラー）
- [ ] 明細の借方・貸方が両方とも正の場合はエラー（debit XOR credit）
- [ ] 貸借不一致の場合は 422 エラーになる
- [ ] 該当する会計期間が存在しない日付を指定した場合は 422 エラーになる
- [ ] isClosed=true の会計期間に属する日付を指定した場合は 422 エラーになる
- [ ] 正常に保存すると仕訳一覧に遷移する

### 仕訳編集

仕訳編集画面（`/journal-entries/[id]/edit`）で既存仕訳を更新する。

- 明細は全置換（PATCH /api/ledger/journal-entries/[id]）
- POSTED 済み仕訳も編集可能（isClosed でない期間に限る）
- isClosed=true の期間に属する仕訳は編集不可（422）

**受入条件:**

- [ ] 既存の仕訳データが編集フォームに初期表示される
- [ ] 保存時に仕訳入力と同等のバリデーションが実施される
- [ ] isClosed=true の期間の仕訳は保存できない（422 エラー）

### 仕訳削除

仕訳一覧または編集画面から仕訳を削除する。

- isClosed=true の期間の仕訳は削除不可（422）

**受入条件:**

- [ ] 削除確認ダイアログが表示される
- [ ] 削除後は仕訳一覧に遷移する
- [ ] isClosed=true の期間の仕訳は削除できない（422 エラー）

## 画面

| パス | 主要UI要素 |
|------|----------|
| `/journal-entries` | 仕訳一覧テーブル（番号・日付・摘要・ステータス・取引先）、検索フィルタ、ページネーション、新規作成ボタン |
| `/journal-entries/new` | 日付・摘要・ステータス・取引先の入力フォーム、明細行テーブル（科目・借方・貸方・摘要）、行追加ボタン、貸借差額表示、保存ボタン |
| `/journal-entries/[id]/edit` | 仕訳入力と同じ構成（既存データ初期値表示）、削除ボタン |

## API

（出典: `interfaces/ledger_interface.md`）

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/ledger/journal-entries | 仕訳一覧（?from=&to=&accountId=&partnerId=&q=&page=&limit=） |
| POST | /api/ledger/journal-entries | 仕訳作成（明細含む） |
| GET | /api/ledger/journal-entries/[id] | 仕訳取得（明細含む） |
| PATCH | /api/ledger/journal-entries/[id] | 仕訳更新（明細は全置換） |
| DELETE | /api/ledger/journal-entries/[id] | 仕訳削除 |

**リクエストボディ（POST/PATCH）:**

```typescript
// interfaces/ledger_interface.md より
type JournalEntryInput = {
  date: string;                // YYYY-MM-DD
  description: string;
  status?: "DRAFT" | "POSTED";
  partnerId?: string | null;
  lines: { accountId: string; debit: number; credit: number; memo?: string }[];
};
```

## ビジネスルール

（出典: `interfaces/ledger_interface.md`）

- 仕訳は明細2行以上、各明細は debit XOR credit（片方のみ正の整数）
- 仕訳全体で Σdebit === Σcredit でなければ 422 を返す
- 仕訳の date は登録先 FiscalPeriod の期間内であること。該当期間がなければ 422
- isClosed=true の会計期間に属する仕訳の作成・更新・削除は 422

## 受入条件（機能全体）

- [ ] 仕訳を新規作成し、仕訳一覧に表示されることを確認できる
- [ ] DRAFT で保存した仕訳を後から POSTED に変更できる
- [ ] 貸借不一致・明細1行・期間外日付は全てバリデーションエラーになる
- [ ] isClosed の期間の仕訳は作成・更新・削除いずれもエラーになる
- [ ] 取引先を紐付けた仕訳が正しく保存・表示される

## 関連設計書

- 画面遷移図: [design/screen-flow.md](../../design/screen-flow.md)
- API仕様: [design/api-spec.md](../../design/api-spec.md)
- DB設計: [design/db-design.md](../../design/db-design.md)

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2026-06-05 | 初版作成 |

<!-- /review -->
