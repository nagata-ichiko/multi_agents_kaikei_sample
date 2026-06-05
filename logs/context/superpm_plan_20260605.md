# SuperPM 実行計画: 会計アプリ新規構築（2026-06-05）

## ユーザー承認事項
- DB: PostgreSQL（Docker / docker-compose）
- 意図的なバグ混入: なし（正しく作る）
- 機能スコープ・3ドメイン構成: 承認済み
- 途中の承認ゲート（IF承認・フェーズ間承認）: お任せでスキップ、最後にまとめて報告

## 技術スタック（確定）
- Next.js 15（App Router / TypeScript / src ディレクトリ / リポジトリルートに配置）
- Tailwind CSS v4、recharts（グラフ）、zod（バリデーション）
- Prisma ORM + PostgreSQL 16（docker-compose、ホストポート 5433）
- テスト: Vitest（ユニット: 集計・バリデーションロジック）

## ドメイン構成
| ドメイン | REQ-ID | 内容 |
|---------|--------|------|
| ledger | REQ-LEDGER-001/002/003 | 仕訳入力・勘定科目・帳簿（仕訳帳/総勘定元帳） |
| reporting | REQ-REPORT-001/002/003 | 試算表・PL/BS・ダッシュボード（読み取り専用） |
| master | REQ-MASTER-001/002 | 取引先・会計期間 |

## 実行フェーズ
- フェーズ0: IF定義（interfaces/*.md）+ 要件定義書・基本設計書（spec-writer委任、worktree分離）→ 完了
- フェーズ1: 共通基盤（scaffold/DB/共通UI/レイアウト/シード）。coder 1体、main直接。**完了まで個別機能タスク起動禁止**
- フェーズ2: 3ドメイン並列実装（各ドメインPM = worktree分離、ブランチ feat/[domain]）
- フェーズ3: 統合（ledger → master → reporting の順にマージ）→ 横断レビュー → build/test → 動作確認 → コミット

## ブランチ
- docs/spec-initial（フェーズ0ドキュメント）
- main 直接（フェーズ1。並列がないため）
- feat/ledger, feat/reporting, feat/master（フェーズ2）

## 画面一覧（ルーティング確定）
| パス | 画面 | ドメイン |
|------|------|---------|
| / | ダッシュボード | reporting |
| /journal-entries | 仕訳一覧 | ledger |
| /journal-entries/new | 仕訳入力 | ledger |
| /journal-entries/[id]/edit | 仕訳編集 | ledger |
| /accounts | 勘定科目管理 | ledger |
| /books/journal | 仕訳帳 | ledger |
| /books/general-ledger | 総勘定元帳 | ledger |
| /reports/trial-balance | 試算表 | reporting |
| /reports/income-statement | 損益計算書 | reporting |
| /reports/balance-sheet | 貸借対照表 | reporting |
| /partners | 取引先管理 | master |
| /settings/fiscal-periods | 会計期間設定 | master |
