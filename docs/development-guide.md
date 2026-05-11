# Development Guide

Brewia の実装方針・構成・開発フローをまとめた開発者向けガイドです。

## 技術スタック

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **DB Access**: Drizzle ORM
- **Database**: Turso（libSQL/SQLite）
- **Validation**: Zod
- **UI**: React + Tailwind CSS

## レイヤ構成

責務を分離し、以下のレイヤーに実装しています。

### Route Layer (`app/api/**/route.ts`)

HTTP I/O の入口。リクエストの受理・バリデーション・レスポンス整形を担います。ビジネスロジックは持たず Service を呼び出します。

### Service Layer (`app/**/service.ts`)

ユースケース単位のオーケストレーション。DTO をドメイン入力へ整形し、Repository への依存のみを持ちます。

### Repository Layer (`app/**/repository.ts`)

永続化の責務（Drizzle クエリ、トランザクション）。DB テーブル構造とアプリ型のマッピング、関連データ削除や中間テーブル更新など整合性担保を行います。

### Schema Layer (`app/**/schema.ts`)

Zod による API 入力 DTO の定義。Route で利用し、入力バリデーションを共通化します。

## ディレクトリガイド

```text
app/
  page.tsx
  new/page.tsx
  beans/
    page.tsx
    [id]/page.tsx
    service.ts
    repository.ts
    schema.ts
  brews/
    [id]/page.tsx
    service.ts
    repository.ts
    schema.ts
  flavors/
    service.ts
    repository.ts
  api/
    beans/route.ts
    beans/[id]/route.ts
    brews/route.ts
    brews/[id]/route.ts
    flavors/route.ts

lib/
  db/
    schema.ts
    drizzle.ts
    row-utils.ts
```

## 命名規約

`route.ts` と同じく、リソースディレクトリ内でシンプルな固定ファイル名にしています。

- `service.ts`: ユースケース
- `repository.ts`: DBアクセス
- `schema.ts`: DTO/Zod

クラス名は複数形リソース基準:
- `BeansService`, `BrewsService`, `FlavorsService`
- `BeansRepository`, `BrewsRepository`, `FlavorsRepository`

## データフロー

例: `PUT /api/brews/:id`

1. Route が JSON を受け取り、Zod スキーマでバリデーション
2. Service が DTO を受け取り、`notes` や `flavorIds` を正規化
3. Repository がトランザクションで以下を実行
   - `brew` 更新
   - 既存 `brew_flavor` を削除
   - 新しい `brew_flavor` を再作成
4. Route が HTTP レスポンスを返却

詳細なシーケンス図は `docs/api-spec.md` の「データフロー」セクションを参照してください。

## API 仕様

エンドポイント一覧・リクエスト/レスポンス DTO の詳細は [api-spec.md](./api-spec.md) を参照してください。

## 入力バリデーション方針

- すべての Create/Update 系 API は Zod スキーマを通す
- optional な文字列は Schema 層で空文字（`""`）として正規化
- 重複配列（`flavorIds`）は Service 層で `Set` を使って重複除去

## トランザクション方針

整合性が壊れやすい更新は Repository でトランザクション化します。

- Brew 更新時: Brew 本体更新 → 中間テーブル再構成
- Brew 削除時: 中間テーブル削除 → Brew 削除
- Bean 削除時: 紐づく Brew を取得 → BrewFlavor を削除 → Brew を削除 → Bean を削除

## 開発フロー

### セットアップ

```bash
pnpm install
pnpm dev
```

### 推奨チェック

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

環境によっては Google Fonts の取得で `pnpm build` が失敗することがあります。

### DB スキーマ変更

`lib/db/schema.ts` を編集後、`pnpm db:generate` で Drizzle スキーマから差分マイグレーションを生成します。手動 SQL を編集する場合は journal の整合性に注意してください。マイグレーション履歴は `drizzle/` 配下の連番 SQL ファイルで追えます。

## 追加実装時のガイド

新しいリソース（例: `roasters`）を追加する場合は、以下の順で実装すると一貫性を保てます。

1. `app/roasters/schema.ts` を作成
2. `app/roasters/repository.ts` を作成
3. `app/roasters/service.ts` を作成
4. `app/api/roasters/route.ts`, `app/api/roasters/[id]/route.ts` を追加

## 環境変数

サーバ動作に必要なキー。

```bash
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
AUTH_SECRET=                     # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
ANTHROPIC_API_KEY=               # /api/beans/extract で使用
ANTHROPIC_MODEL=                 # 任意。既定 claude-3-5-haiku-20241022
```

`AUTH_URL` は Vercel デプロイで自動設定される。カスタムドメイン使用時のみ明示指定。

## 制約

- 更新 API は「全項目更新（PUT）」前提。部分更新（PATCH）は未提供。

## PWA

### 対応の狙い

- ホーム画面への追加によるアプリとしてのインストール（スタンドアロン表示）
- 最低限のオフライン対応（ネットワーク不通時にフォールバックページを表示）

### ファイル構成

| ファイル | 役割 |
|---|---|
| `app/manifest.ts` | `/manifest.webmanifest` を配信する Next.js file convention |
| `app/offline/page.tsx` | オフラインフォールバック Server Component |
| `components/service-worker-registrar.tsx` | `navigator.serviceWorker.register('/sw.js')` を呼ぶ Client Component |
| `public/sw.js` | 純 JS の Service Worker |
| `public/icon-192.png`, `public/icon-512.png` | PWA マニフェストアイコン（`public/icon.svg` から生成） |
| `app/layout.tsx` | `metadata.manifest`, `metadata.appleWebApp`, `<ServiceWorkerRegistrar />` を追加 |

### Service Worker のキャッシュ戦略

- **Cache First**: `/_next/static/` 配下の静的アセット（ハッシュ付きのため常に安全）
- **Network First**: その他の GET リクエスト
- **スルー（キャッシュなし）**: `/api/` へのリクエスト
- **navigate 失敗時**: `/offline` へフォールバック

### `CACHE_NAME` のバンプ運用

`public/sw.js` の fetch 戦略や precache 対象を変更したら、ファイル先頭の

```js
const CACHE_NAME = 'brewia-shell-vN'
```

の `N` を必ず上げること。バンプしないと古いキャッシュが残り続け、変更が反映されない。

### アイコン再生成手順（macOS 前提）

SVG から高解像度 PNG を生成する場合は `qlmanage` を使用する。

```bash
qlmanage -t -s 192 -o /tmp public/icon.svg && mv /tmp/icon.svg.png public/icon-192.png
qlmanage -t -s 512 -o /tmp public/icon.svg && mv /tmp/icon.svg.png public/icon-512.png
```

### 開発時の注意

dev server と SW キャッシュが干渉して古い内容が表示される場合は、Chrome DevTools の Application タブ → Service Workers から該当の SW を **Unregister** すると回復する。

### スコープ外

以下は現時点で対応対象外とする。

- プッシュ通知
- バックグラウンド同期
- インストールプロンプト UI
- 動的 API レスポンスの永続キャッシュ
