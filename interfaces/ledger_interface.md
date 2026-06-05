# ledger サービス インターフェース

## バージョン
| 項目 | 値 |
|------|-----|
| IF バージョン | 1 |
| 最終更新 | 2026-06-05 |
| 担当ドメイン | ledger |

## 責務
仕訳（複式簿記）・勘定科目・帳簿（仕訳帳/総勘定元帳）の管理。

## 提供するエンドポイント
| メソッド | パス | 概要 | 対応Spec |
|---------|------|------|---------|
| GET | /api/ledger/accounts | 勘定科目一覧（?type=&active=&q=） | REQ-LEDGER-002 |
| POST | /api/ledger/accounts | 勘定科目作成 | REQ-LEDGER-002 |
| GET | /api/ledger/accounts/[id] | 勘定科目取得 | REQ-LEDGER-002 |
| PATCH | /api/ledger/accounts/[id] | 勘定科目更新 | REQ-LEDGER-002 |
| DELETE | /api/ledger/accounts/[id] | 勘定科目削除（仕訳明細で使用中なら 409、代わりに isActive=false を推奨） | REQ-LEDGER-002 |
| GET | /api/ledger/journal-entries | 仕訳一覧（?from=&to=&accountId=&partnerId=&q=&page=&limit=） | REQ-LEDGER-001 |
| POST | /api/ledger/journal-entries | 仕訳作成（明細含む） | REQ-LEDGER-001 |
| GET | /api/ledger/journal-entries/[id] | 仕訳取得（明細含む） | REQ-LEDGER-001 |
| PATCH | /api/ledger/journal-entries/[id] | 仕訳更新（明細は全置換） | REQ-LEDGER-001 |
| DELETE | /api/ledger/journal-entries/[id] | 仕訳削除 | REQ-LEDGER-001 |
| GET | /api/ledger/general-ledger | 総勘定元帳（?accountId=必須&from=&to=。期首残高+明細+累計残高を返す） | REQ-LEDGER-003 |

## 提供する型定義
```typescript
// src/types/ledger.ts に配置（他ドメイン参照可）
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type Account = {
  id: string;
  code: string;        // 科目コード（例: "101"）一意
  name: string;        // 例: 現金
  type: AccountType;
  description: string | null;
  isActive: boolean;
};

export type JournalLine = {
  id: string;
  accountId: string;
  account?: Account;
  debit: number;       // 円・整数。debit/credit はどちらか一方のみ > 0
  credit: number;
  memo: string | null;
  lineOrder: number;
};

export type JournalEntry = {
  id: string;
  entryNumber: number;     // 自動連番
  date: string;            // ISO 8601 (YYYY-MM-DD)
  description: string;
  status: "DRAFT" | "POSTED";
  partnerId: string | null;
  fiscalPeriodId: string;
  lines: JournalLine[];
};

// POST/PATCH リクエストボディ
export type JournalEntryInput = {
  date: string;
  description: string;
  status?: "DRAFT" | "POSTED";
  partnerId?: string | null;
  lines: { accountId: string; debit: number; credit: number; memo?: string }[];
};
```

## ビジネスルール（不変条件）
- 仕訳は明細2行以上、各明細は debit XOR credit（片方のみ正の整数）
- 仕訳全体で Σdebit === Σcredit（貸借一致）でなければ 422 を返す
- 仕訳の date は登録先 FiscalPeriod（master ドメイン提供）の期間内であること。該当期間がなければ 422
- isClosed=true の会計期間に属する仕訳の作成・更新・削除は 422

## DBモデル所有権
Account / JournalEntry / JournalLine（prisma/schema.prisma 内。スキーマ変更はフェーズ1で確定済み、変更時はSuperPM承認必須）

## 利用する他ドメインのIF
| 依存先ドメイン | 利用するエンドポイント/型 | 用途 |
|-------------|----------------------|------|
| master | FiscalPeriod, Partner 型 / DB読み取り | 仕訳の期間判定・取引先紐付け |

## 破壊的変更ルール
- エンドポイントの削除・パス変更・レスポンス型の変更は破壊的変更。消費者（reporting）のIFも同時更新し、IFバージョンを+1する
