# Clean Architecture / API リファクタリング概要

本ドキュメントは、`lib/server` 配下に導入したレイヤー構成と、追加された編集・削除 API の仕様をまとめたものです。

## 1. 目的

- Nest.js で一般的なファイル命名（`*.service.ts`）に寄せて責務を明確化する。
- ルーティング層と永続化層を分離し、保守性を高める。
- Bean/Brew の CRUD を API レベルで揃える（編集・削除の追加）。

## 2. レイヤー構成

```text
app/api/*                # Controller 相当（HTTP 入出力）
  └─ route.ts

lib/server/*             # アプリケーション層 / インフラ層
  ├─ *.schema.ts         # DTO バリデーション（Zod）
  ├─ *.service.ts        # ユースケース
  └─ *.repository.ts     # DB アクセス（Drizzle）

lib/db/index.ts          # 既存コード互換の Facade
```

### 各層の責務

- **route.ts**
  - リクエスト受け取り
  - スキーマ検証
  - HTTP ステータスを含むレスポンス生成
- **service**
  - 入力正規化
  - ユースケース実行（作成/更新/削除/参照）
  - 必要な repository 呼び出しのオーケストレーション
- **repository**
  - Drizzle を使った SQL 実行
  - トランザクション管理
  - DB row と型のマッピング

## 3. 追加 API（編集 / 削除）

### Beans

- `PUT /api/beans/:id`
  - Bean を更新
  - バリデーション失敗: `400`
  - 対象なし: `404`
  - 成功: `200`（更新後オブジェクト）

- `DELETE /api/beans/:id`
  - Bean を削除
  - 関連 Brew と BrewFlavor もトランザクション内で削除
  - 対象なし: `404`
  - 成功: `204`

### Brews

- `PUT /api/brews/:id`
  - Brew を更新
  - 更新時に BrewFlavor を一旦削除して再登録
  - バリデーション失敗: `400`
  - 対象なし: `404`
  - 成功: `200`（更新後オブジェクト）

- `DELETE /api/brews/:id`
  - Brew を削除
  - 関連 BrewFlavor も削除
  - 対象なし: `404`
  - 成功: `204`

## 4. DTO / バリデーション

- `lib/server/beans/beans.schema.ts`
  - Bean の作成・更新 payload を共通定義
- `lib/server/brews/brews.schema.ts`
  - Brew の作成・更新 payload を共通定義

## 5. 互換性ポリシー

- 既存ページや処理が `@/lib/db` を参照しているため、
  `lib/db/index.ts` は service を委譲する **Facade** として維持。
- これにより呼び出し側の大きな改修なしで内部構造のみ段階的に改善。
