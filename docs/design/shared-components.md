# 共通コンポーネント・ユーティリティ リファレンス

フェーズ2の全ドメイン（ledger / reporting / master）はこのファイルを参照し、既存の共通コンポーネントを活用すること。

## UIコンポーネント（src/components/ui/）

### Button

ファイル: `src/components/ui/Button.tsx`

```tsx
import { Button } from '@/components/ui/Button';

// variant: primary | secondary | danger | ghost
// size: sm | md
<Button variant="primary" size="md">保存</Button>
<Button variant="secondary" size="sm">キャンセル</Button>
<Button variant="danger" loading={isDeleting} onClick={handleDelete}>削除</Button>
<Button variant="ghost" size="sm">閉じる</Button>
```

Props:
| prop | type | default | 説明 |
|------|------|---------|------|
| variant | primary \| secondary \| danger \| ghost | primary | 色・スタイル |
| size | sm \| md | md | サイズ |
| loading | boolean | false | スピナー表示＋disabled |
| ...HTMLButtonAttributes | - | - | ネイティブbutton属性をすべて受け付ける |

---

### Input

ファイル: `src/components/ui/Input.tsx`

```tsx
import { Input } from '@/components/ui/Input';

<Input label="伝票番号" placeholder="0001" />
<Input label="日付" type="date" error={errors.date} />
```

Props:
| prop | type | 説明 |
|------|------|------|
| label | string? | ラベルテキスト。htmlForを自動設定 |
| error | string? | エラーメッセージ（赤枠＋テキスト） |
| ...HTMLInputAttributes | - | ネイティブinput属性をすべて受け付ける |

---

### Select

ファイル: `src/components/ui/Select.tsx`

```tsx
import { Select } from '@/components/ui/Select';

<Select label="科目種別" error={errors.type}>
  <option value="">選択してください</option>
  <option value="ASSET">資産</option>
</Select>
```

Props:
| prop | type | 説明 |
|------|------|------|
| label | string? | ラベルテキスト |
| error | string? | エラーメッセージ |
| children | ReactNode | option要素 |
| ...HTMLSelectAttributes | - | ネイティブselect属性をすべて受け付ける |

---

### Textarea

ファイル: `src/components/ui/Textarea.tsx`

```tsx
import { Textarea } from '@/components/ui/Textarea';

<Textarea label="摘要" placeholder="内容を入力" rows={3} />
<Textarea label="備考" error={errors.note} />
```

Props:
| prop | type | 説明 |
|------|------|------|
| label | string? | ラベルテキスト |
| error | string? | エラーメッセージ |
| ...HTMLTextareaAttributes | - | ネイティブtextarea属性（rows等）をすべて受け付ける |

---

### Card

ファイル: `src/components/ui/Card.tsx`

```tsx
import { Card } from '@/components/ui/Card';

<Card title="仕訳一覧" action={<Button>新規作成</Button>}>
  <p>コンテンツ</p>
</Card>
```

Props:
| prop | type | 説明 |
|------|------|------|
| title | string? | カードヘッダータイトル |
| action | ReactNode? | ヘッダー右側のアクション（ボタン等） |
| children | ReactNode | カード本体コンテンツ |
| className | string? | 追加CSSクラス |

---

### Table

ファイル: `src/components/ui/Table.tsx`

```tsx
import { Table, type Column } from '@/components/ui/Table';

const columns: Column<JournalEntry>[] = [
  { key: 'date', header: '日付', render: (row) => formatDate(row.date) },
  { key: 'amount', header: '金額', align: 'right', render: (row) => formatCurrency(row.amount) },
];

<Table columns={columns} rows={entries} keyExtractor={(r) => r.id} emptyMessage="仕訳がありません" />
```

Props:
| prop | type | 説明 |
|------|------|------|
| columns | Column\<T\>[] | 列定義。key/header/align/renderを含む |
| rows | T[] | 行データ配列 |
| keyExtractor | (row: T) => string | 行ごとのユニークキー |
| emptyMessage | string? | データなし時のメッセージ |

Column型:
```ts
type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
};
```

---

### Modal

ファイル: `src/components/ui/Modal.tsx`

```tsx
import { Modal } from '@/components/ui/Modal';

const [open, setOpen] = useState(false);

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="仕訳編集"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>閉じる</Button>
      <Button>保存</Button>
    </>
  }
>
  <p>モーダルコンテンツ</p>
</Modal>
```

Props:
| prop | type | 説明 |
|------|------|------|
| open | boolean | 表示/非表示 |
| onClose | () => void | 閉じるハンドラ（ESCキー/バックドロップクリックでも発火） |
| title | string? | ヘッダータイトル |
| children | ReactNode | モーダル本体 |
| footer | ReactNode? | フッター（ボタン等） |

---

### Badge

ファイル: `src/components/ui/Badge.tsx`

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="green">POSTED</Badge>
<Badge variant="amber">DRAFT</Badge>
<Badge variant="red">エラー</Badge>
<Badge variant="blue">INFO</Badge>
<Badge variant="gray">UNKNOWN</Badge>
```

Props:
| prop | type | default | 説明 |
|------|------|---------|------|
| variant | gray \| green \| red \| blue \| amber | gray | 色 |
| children | ReactNode | - | バッジテキスト |
| className | string? | - | 追加CSSクラス |

---

### PageHeader

ファイル: `src/components/ui/PageHeader.tsx`

```tsx
import { PageHeader } from '@/components/ui/PageHeader';

<PageHeader
  title="仕訳一覧"
  description="仕訳を管理します"
  action={<Button>新規作成</Button>}
/>
```

Props:
| prop | type | 説明 |
|------|------|------|
| title | string | ページタイトル（h1として表示） |
| description | string? | サブテキスト |
| action | ReactNode? | 右側アクション（ボタン等） |

---

### EmptyState

ファイル: `src/components/ui/EmptyState.tsx`

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon={<svg className="h-12 w-12">...</svg>}
  message="仕訳がありません"
  description="新規作成ボタンから仕訳を追加してください"
  action={<Button>新規作成</Button>}
/>
```

Props:
| prop | type | 説明 |
|------|------|------|
| icon | ReactNode? | アイコン（SVG等）。グレーで表示 |
| message | string | メインメッセージ |
| description | string? | サブテキスト |
| action | ReactNode? | アクション（ボタン等） |

---

### Toast / ToastProvider / useToast

ファイル: `src/components/ui/Toast.tsx`

Toast はルートレイアウト（`src/app/layout.tsx`）の `ToastProvider` で提供済み。各ページ・コンポーネントで `useToast` を呼ぶだけで使える。

```tsx
import { useToast } from '@/components/ui/Toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showToast('success', '保存しました');
    } catch {
      showToast('error', '保存に失敗しました');
    }
  };
}
```

`useToast()` 戻り値:
| メソッド | 型 | 説明 |
|---------|-----|------|
| showToast | (type: 'success' \| 'error', message: string) => void | トースト表示。4秒後に自動消去 |
| removeToast | (id: string) => void | 指定IDのトーストを手動消去 |
| toasts | Toast[] | 現在表示中のトースト一覧 |

---

### ConfirmDialog

ファイル: `src/components/ui/ConfirmDialog.tsx`
依存: Modal, Button

```tsx
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const [open, setOpen] = useState(false);

<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="削除確認"
  message="この仕訳を削除しますか？この操作は元に戻せません。"
  confirmLabel="削除"
  loading={isDeleting}
/>
```

Props:
| prop | type | default | 説明 |
|------|------|---------|------|
| open | boolean | - | 表示/非表示 |
| onClose | () => void | - | キャンセル時のハンドラ |
| onConfirm | () => void | - | 確認ボタン押下時のハンドラ |
| title | string? | "確認" | ダイアログタイトル |
| message | string | - | 確認メッセージ |
| confirmLabel | string? | "削除" | 確認ボタンのラベル |
| cancelLabel | string? | "キャンセル" | キャンセルボタンのラベル |
| loading | boolean? | false | ローディング状態（確認ボタンにスピナー） |

---

### Pagination

ファイル: `src/components/ui/Pagination.tsx`

```tsx
import { Pagination } from '@/components/ui/Pagination';

const [page, setPage] = useState(1);

<Pagination page={page} totalPages={10} onPageChange={setPage} />
```

Props:
| prop | type | 説明 |
|------|------|------|
| page | number | 現在のページ番号（1-indexed） |
| totalPages | number | 総ページ数。1以下の場合はコンポーネント自体が非表示 |
| onPageChange | (page: number) => void | ページ変更時のコールバック |

---

## レイアウトコンポーネント（src/components/layout/）

### Sidebar

ファイル: `src/components/layout/Sidebar.tsx`

アプリシェル（`src/app/(app)/layout.tsx`）に組み込み済み。個別ページで直接使わない。
ダークネイビー（`bg-slate-900`）固定サイドバー（幅 `w-56`）。usePathname でアクティブリンクを自動ハイライト（indigo-600）。

ナビゲーション構成（URLは superpm_plan_20260605 の確定ルーティング通り）:

| セクション | ラベル | href |
|-----------|--------|------|
| ダッシュボード | ダッシュボード | / |
| 仕訳 | 仕訳一覧 | /journal-entries |
| 仕訳 | 仕訳入力 | /journal-entries/new |
| 帳簿 | 仕訳帳 | /books/journal |
| 帳簿 | 総勘定元帳 | /books/general-ledger |
| 帳簿 | 勘定科目 | /accounts |
| レポート | 試算表 | /reports/trial-balance |
| レポート | 損益計算書 | /reports/income-statement |
| レポート | 貸借対照表 | /reports/balance-sheet |
| マスタ | 取引先 | /partners |
| マスタ | 会計期間 | /settings/fiscal-periods |

---

### Header

ファイル: `src/components/layout/Header.tsx`

アプリシェルに組み込み済み。個別ページで直接使わない。ページ上部バー（高さ `h-16`、`bg-white`）。

---

## ライブラリユーティリティ（src/lib/）

### format.ts

```ts
import { formatCurrency, formatDate, parseYmd } from '@/lib/format';

formatCurrency(1234567)           // → "¥1,234,567"
formatDate(new Date(2026, 3, 1))  // → "2026/04/01"
formatDate("2026-04-01")          // → "2026/04/01" (UTC文字列はタイムゾーン依存に注意)
parseYmd("2026-04-01")            // → Date object (ローカルタイム、UTCシフトなし)
```

| 関数 | シグネチャ | 説明 |
|-----|-----------|------|
| formatCurrency | (amount: number) => string | Intl.NumberFormatで¥記号付き整数表記 |
| formatDate | (date: Date \| string) => string | YYYY/MM/DD形式にフォーマット |
| parseYmd | (ymd: string) => Date | YYYY-MM-DD文字列をローカルタイムのDateに変換 |

---

### prisma.ts

```ts
import { prisma } from '@/lib/prisma';
```

グローバルシングルトンパターン（HMR対策）。Route Handler と Server Component から使用する。
クライアントコンポーネントからは直接使わない（apiFetch 経由でRoute Handlerを呼ぶ）。

---

### api-helpers.ts（Route Handler専用）

```ts
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';

// Route Handler での使用例
export async function GET() {
  try {
    const data = await prisma.account.findMany();
    return jsonOk(data);
  } catch (e) {
    return handleApiError(e);
  }
}
// ZodError → 422（バリデーションエラー詳細付き）、その他 → 500
```

| 関数 | シグネチャ | 説明 |
|-----|-----------|------|
| jsonOk | (data: T, status?: number) => NextResponse | 成功レスポンス（デフォルト200） |
| jsonError | (status: number, message: string, details?: unknown) => NextResponse | エラーレスポンス |
| handleApiError | (e: unknown) => NextResponse | ZodError→422, その他エラー→500 |

---

### client-fetch.ts（クライアントコンポーネント専用）

```ts
import { apiFetch } from '@/lib/client-fetch';

// GETの例
const data = await apiFetch<Account[]>('/api/accounts');

// POSTの例
const created = await apiFetch<Account>('/api/accounts', {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

| 関数 | シグネチャ | 説明 |
|-----|-----------|------|
| apiFetch | (url: string, options?: RequestInit) => Promise\<T\> | fetch wrapper。Content-Type: application/json を自動付与。レスポンスがokでない場合は `json.error` をthrow |

---

## 型定義（src/types/）

### ledger.ts

仕訳・仕訳明細・勘定科目の型定義（`interfaces/ledger_interface.md` のTypeScript実装）。

### master.ts

取引先・会計期間の型定義（`interfaces/master_interface.md` のTypeScript実装）。

### reporting.ts

試算表・損益計算書・貸借対照表の型定義（`interfaces/reporting_interface.md` のTypeScript実装）。

---

## デザイントークン

| 項目 | Tailwindクラス |
|------|--------------|
| サイドバー背景色 | bg-slate-900 |
| アクセントカラー（プライマリ） | indigo-600 |
| カード背景 | bg-white |
| カードスタイル | rounded-xl shadow-sm border border-gray-100 |
| エラーカラー | red-600 |
| 成功カラー | green-600 |
| コンテンツエリアパディング | p-6 |
