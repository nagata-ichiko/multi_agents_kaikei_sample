# API設計概要

## 概要

Next.js 15 App Router の Route Handler による REST API。全エンドポイントは `/api/` 配下に配置し、ドメイン別にパスを分ける。APIスタイルは REST（JSON）。

## 全エンドポイント一覧

（出典: `interfaces/ledger_interface.md` / `interfaces/reporting_interface.md` / `interfaces/master_interface.md`）

### ledger ドメイン

| メソッド | パス | 概要 | 対応Spec |
|---------|------|------|---------|
| GET | /api/ledger/accounts | 勘定科目一覧（?type=&active=&q=） | REQ-LEDGER-002 |
| POST | /api/ledger/accounts | 勘定科目作成 | REQ-LEDGER-002 |
| GET | /api/ledger/accounts/[id] | 勘定科目取得 | REQ-LEDGER-002 |
| PATCH | /api/ledger/accounts/[id] | 勘定科目更新 | REQ-LEDGER-002 |
| DELETE | /api/ledger/accounts/[id] | 勘定科目削除（使用中なら 409、isActive=false を推奨） | REQ-LEDGER-002 |
| GET | /api/ledger/journal-entries | 仕訳一覧（?from=&to=&accountId=&partnerId=&q=&page=&limit=） | REQ-LEDGER-001 |
| POST | /api/ledger/journal-entries | 仕訳作成（明細含む） | REQ-LEDGER-001 |
| GET | /api/ledger/journal-entries/[id] | 仕訳取得（明細含む） | REQ-LEDGER-001 |
| PATCH | /api/ledger/journal-entries/[id] | 仕訳更新（明細は全置換） | REQ-LEDGER-001 |
| DELETE | /api/ledger/journal-entries/[id] | 仕訳削除 | REQ-LEDGER-001 |
| GET | /api/ledger/general-ledger | 総勘定元帳（?accountId=必須&from=&to=） | REQ-LEDGER-003 |

### reporting ドメイン（読み取り専用）

| メソッド | パス | 概要 | 対応Spec |
|---------|------|------|---------|
| GET | /api/reporting/trial-balance | 合計残高試算表（?periodId= または ?from=&to=） | REQ-REPORT-001 |
| GET | /api/reporting/income-statement | 損益計算書（?periodId=） | REQ-REPORT-002 |
| GET | /api/reporting/balance-sheet | 貸借対照表（?periodId=&asOf=） | REQ-REPORT-002 |
| GET | /api/reporting/dashboard | ダッシュボード集計（?periodId=） | REQ-REPORT-003 |

### master ドメイン

| メソッド | パス | 概要 | 対応Spec |
|---------|------|------|---------|
| GET | /api/master/partners | 取引先一覧（?type=&active=&q=） | REQ-MASTER-001 |
| POST | /api/master/partners | 取引先作成 | REQ-MASTER-001 |
| GET | /api/master/partners/[id] | 取引先取得 | REQ-MASTER-001 |
| PATCH | /api/master/partners/[id] | 取引先更新 | REQ-MASTER-001 |
| DELETE | /api/master/partners/[id] | 取引先削除（仕訳で使用中なら 409） | REQ-MASTER-001 |
| GET | /api/master/fiscal-periods | 会計期間一覧 | REQ-MASTER-002 |
| POST | /api/master/fiscal-periods | 会計期間作成（期間重複は 422） | REQ-MASTER-002 |
| PATCH | /api/master/fiscal-periods/[id] | 会計期間更新（締め isClosed 切替含む） | REQ-MASTER-002 |
| DELETE | /api/master/fiscal-periods/[id] | 会計期間削除（仕訳が存在すれば 409） | REQ-MASTER-002 |

## レスポンス共通規則

| ステータスコード | 用途 |
|---------------|------|
| 200 | 成功（GET / PATCH） |
| 201 | 作成成功（POST） |
| 400 | リクエスト不正（必須パラメータ欠如など） |
| 409 | 競合（使用中リソースの削除） |
| 422 | バリデーションエラー（貸借不一致・期間重複・閉鎖期間の変更など） |
| 404 | リソース未存在 |
| 500 | サーバーエラー |

エラーレスポンス形式（`src/lib/api-helpers.ts` の `jsonError` が生成）:

```json
{
  "message": "エラーの概要",
  "details": {}
}
```
