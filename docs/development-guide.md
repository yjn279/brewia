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

### 3.2 Service Layer (`app/api/**/servce.ts`)
- ユースケース単位のオーケストレーション
- DTO をドメイン入力へ整形（例: 文字列の null 正規化）
- Repository への依存のみを持つ

### 3.3 Repository Layer (`app/api/**/repository.ts`)
- 永続化の責務（Drizzle クエリ、トランザクション）
- DB テーブル構造とアプリ型のマッピング
- 関連データ削除や中間テーブル更新など整合性担保

### 3.4 Schema Layer (`app/api/**/schema.ts`)
- Zod による API 入力 DTO の定義
- Route で利用し、入力バリデーションを共通化

---

## 4. ディレクトリガイド

```text
app/
  api/
    beans/
      route.ts
      [id]/route.ts
    brews/
      route.ts
      [id]/route.ts
    flavors/
      route.ts

lib/
  db/
    schema.ts
    drizzle.ts

app/
  api/
    common/
      null-string.util.ts
    beans/
      schema.ts
      servce.ts
      repository.ts
      route.ts
      [id]/route.ts
    brews/
      schema.ts
      servce.ts
      repository.ts
      route.ts
      [id]/route.ts
    flavors/
      servce.ts
      repository.ts
      route.ts
```

---

## 5. 命名規約

`route.ts` と同じく、リソースディレクトリ内でシンプルな固定ファイル名にしています。

- `servce.ts`: ユースケース
- `repository.ts`: DBアクセス
- `schema.ts`: DTO/Zod
- `*.util.ts`: 横断ユーティリティ

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
- 文字列 optional は Service 層で `toNullableString` により `null` 正規化
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

1. `app/api/roasters/schema.ts` を作成
2. `app/api/roasters/repository.ts` を作成
3. `app/api/roasters/servce.ts` を作成
4. `app/api/roasters/route.ts`, `app/api/roasters/[id]/route.ts` を追加

---

## 12. 現在の既知課題

- ESLint v9 の flat config (`eslint.config.*`) がないため `pnpm lint` が失敗する
- `build` は実行環境により外部フォント解決に失敗する可能性がある
- 更新 API は現在「全項目更新（PUT）」前提。部分更新（PATCH）は未提供

---

## 13. 変更履歴に関する補足

本ガイドは、Service/Repository/Schema を `app/api` 配下へコロケーションした構成と、Beans/Brews の編集・削除 API 追加後の状態を前提にしています。将来的に構成が変わった場合は、このドキュメントを優先的に更新してください。
