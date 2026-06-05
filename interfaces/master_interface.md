# master サービス インターフェース

## バージョン
| 項目 | 値 |
|------|-----|
| IF バージョン | 1 |
| 最終更新 | 2026-06-05 |
| 担当ドメイン | master |

## 責務
マスタデータの管理（取引先・会計期間）。

## 提供するエンドポイント
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

## 提供する型定義
```typescript
// src/types/master.ts に配置（他ドメイン参照可）
export type PartnerType = "CUSTOMER" | "VENDOR" | "BOTH";

export type Partner = {
  id: string;
  code: string;          // 一意
  name: string;
  kana: string | null;
  type: PartnerType;
  email: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
};

export type FiscalPeriod = {
  id: string;
  name: string;          // 例: 2026年度
  startDate: string;     // YYYY-MM-DD
  endDate: string;
  isClosed: boolean;
};
```

## ビジネスルール
- FiscalPeriod の期間（startDate〜endDate）は他期間と重複不可（422）
- isClosed=true の期間は ledger 側で仕訳変更不可（判定は ledger が行う）

## DBモデル所有権
Partner / FiscalPeriod

## 利用する他ドメインのIF
| 依存先ドメイン | 利用するエンドポイント/型 | 用途 |
|-------------|----------------------|------|
| ledger | JournalEntry / JournalLine の存在チェック（DB読み取りのみ） | 削除時の使用中判定 |

## 破壊的変更ルール
- エンドポイントの削除・パス変更・レスポンス型の変更は破壊的変更。消費者（ledger / reporting）のIFも同時更新し、IFバージョンを+1する
