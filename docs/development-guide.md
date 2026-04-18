# Development Guide

このドキュメントは、Brewia の実装方針・構成・開発フローを **全体像ベース** でまとめた開発者向けガイドです。

---

## 1. プロダクト概要

Brewia は「豆（Bean）」と「抽出（Brew）」を中心に、風味（Flavor）やテイスティング評価を記録するアプリです。

主なユースケース:
- 豆を登録する
- 豆に紐づく抽出ログを残す
- 抽出に対して味覚評価と風味タグを付与する
- 豆ごとの履歴を振り返る

---

## 2. 技術スタック

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **DB Access**: Drizzle ORM
- **Database**: Turso/SQLite
- **Validation**: Zod
- **UI**: React + Tailwind CSS

---

## 3. アーキテクチャ方針（Clean Architecture 寄り）

責務を分離し、実装は以下のレイヤーに寄せています。

### 3.1 Route Layer (`app/api/**/route.ts`)
- HTTP I/O の入口
- リクエストの受理、バリデーション、レスポンス整形
- ビジネスロジックは持たず Service を呼び出す

### 3.2 Service Layer (`app/**/service.ts`)
- ユースケース単位のオーケストレーション
- DTO をドメイン入力へ整形（例: 文字列の null 正規化）
- Repository への依存のみを持つ

### 3.3 Repository Layer (`app/**/repository.ts`)
- 永続化の責務（Drizzle クエリ、トランザクション）
- DB テーブル構造とアプリ型のマッピング
- 関連データ削除や中間テーブル更新など整合性担保

### 3.4 Schema Layer (`app/**/schema.ts`)
- Zod による API 入力 DTO の定義
- Route で利用し、入力バリデーションを共通化

---

## 4. ディレクトリガイド

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

---

## 5. 命名規約

`route.ts` と同じく、リソースディレクトリ内でシンプルな固定ファイル名にしています。

- `service.ts`: ユースケース
- `repository.ts`: DBアクセス
- `schema.ts`: DTO/Zod

クラス名は複数形リソース基準:
- `BeansService`, `BrewsService`, `FlavorsService`
- `BeansRepository`, `BrewsRepository`, `FlavorsRepository`

---

## 6. データフロー

例: `PUT /api/brews/:id`

1. Route が JSON を受け取り、`upsertBrewSchema` でバリデーション
2. Service が DTO を受け取り、`notes` や `flavorIds` を正規化
3. Repository がトランザクションで以下を実行
   - `brew` 更新
   - 既存 `brew_flavor` を削除
   - 新しい `brew_flavor` を再作成
4. Route が HTTP レスポンスを返却

---

## 7. API 仕様（現行）

## 7.1 Beans

- `GET /api/beans`
  - 全 Bean 一覧
- `POST /api/beans`
  - Bean 作成
- `GET /api/beans/:id`
  - 単一 Bean 取得
- `PUT /api/beans/:id`
  - Bean 更新
- `DELETE /api/beans/:id`
  - Bean 削除（関連 Brew / BrewFlavor も削除）

### 主なレスポンス
- `400`: バリデーションエラー
- `404`: 対象なし
- `201`: 作成成功
- `204`: 削除成功

## 7.2 Brews

- `GET /api/brews`
  - Brew 一覧（`?beanId=` 指定時は Bean 単位絞り込み）
- `POST /api/brews`
  - Brew 作成
- `GET /api/brews/:id`
  - 単一 Brew 取得（Bean + Flavors を含む）
- `PUT /api/brews/:id`
  - Brew 更新
- `DELETE /api/brews/:id`
  - Brew 削除（関連 BrewFlavor も削除）

## 7.3 Flavors

- `GET /api/flavors`
  - Flavor 一覧

---

## 8. 入力バリデーション方針

- すべての Create/Update 系 API は Zod schema を通す
- optional な文字列は Schema 層で空文字（`""`）として正規化
- 重複配列（`flavorIds`）は Service 層で `Set` を使って重複除去

---

## 9. トランザクション方針

整合性が壊れやすい更新は Repository でトランザクション化します。

- Brew 更新時
  - Brew 本体更新
  - 中間テーブル再構成
- Brew 削除時
  - 中間テーブル削除
  - Brew 削除
- Bean 削除時
  - 紐づく Brew を取得
  - 先に BrewFlavor を削除
  - Brew を削除
  - 最後に Bean を削除

---

## 10. 開発フロー

### 10.1 セットアップ

```bash
pnpm install
pnpm dev
```

### 10.2 推奨チェック

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

> 注意: 環境によってはフォント取得（Google Fonts）で `pnpm build` が失敗することがあります。

---

## 11. 追加実装時のガイド

新しいリソース（例: `roasters`）を追加する場合は、以下の順で実装すると一貫性を保てます。

1. `app/roasters/schema.ts` を作成
2. `app/roasters/repository.ts` を作成
3. `app/roasters/service.ts` を作成
4. `app/api/roasters/route.ts`, `app/api/roasters/[id]/route.ts` を追加

---

## 12. 現在の既知課題

- `build` は実行環境により外部フォント解決に失敗する可能性がある
- 更新 API は現在「全項目更新（PUT）」前提。部分更新（PATCH）は未提供

---

## 13. 変更履歴に関する補足

本ガイドは、Service/Repository/Schema を `app` 配下（ページと並列）へコロケーションした構成と、Beans/Brews の編集・削除 API 追加後の状態を前提にしています。将来的に構成が変わった場合は、このドキュメントを優先的に更新してください。

---

## 14. PWA

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
