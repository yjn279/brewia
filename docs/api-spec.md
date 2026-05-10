# API 仕様書

Brewia の REST API エンドポイントを網羅した仕様書。
ソースは `app/api/**/route.ts` の実装を正本とする。

**対象範囲**: `app/api/` 配下の全 9 ルートファイル（9 エンドポイント群）  
**更新ポリシー**: `app/api/` 以下の route.ts を追加・変更した際に更新する。  
**関連ドキュメント**: 認証フローの詳細は [Auth Architecture](./auth-architecture.md) を参照。要件の背景は [要件定義書](./requirements.md) を参照。

---

## 1. 認証フロー概要

→ #82, PR #113

- 認証ライブラリ: NextAuth v5（`next-auth@5`）
- プロバイダ: **Google OAuth のみ**（メールマジックリンクは #107 / PR #113 で廃止済み）
- アダプタ: `@auth/drizzle-adapter`（セッションを Turso/SQLite に永続化）
- セッション戦略: `session.strategy = 'database'`（`lib/auth/config.ts:27-29`）
- Vercel Preview: `AUTH_REDIRECT_PROXY_URL` 環境変数でリダイレクトプロキシを設定（`lib/auth/config.ts:14`）
- 初回ログイン: `signIn` イベントで `performBackfill` を実行し、`user_id = NULL` の既存 bean/brew を認証ユーザーに割り当てる（`lib/auth/config.ts:38-44`）

詳細は `docs/auth-architecture.md` を参照。

### 1.1 認証ヘルパ

| ヘルパ | 用途 | 未認証時の挙動 |
| --- | --- | --- |
| `requireUser()` | Server Component / Server Action | `/login` へ redirect |
| `getAuthenticatedUser()` | Route Handler | `null` を返す（401 を呼び出し元が返す） |

---

## 2. 共通事項

### 2.1 認可

全エンドポイント（`/api/auth/*` を除く）は `getAuthenticatedUser()` による認証チェックを行う。未認証の場合は `401 Unauthorized` を返す。

### 2.2 共通エラーレスポンス

| ステータス | 意味 | レスポンス例 |
| --- | --- | --- |
| 401 | 未認証 | `{ "error": "Unauthorized" }` |
| 400 | リクエストボディのバリデーション失敗 | `{ "error": "Invalid request body" }` |
| 404 | リソースが存在しない（または他ユーザーのリソース） | `{ "error": "Bean not found" }` |
| 5xx | サーバー内部エラー | `{ "error": "Internal error", "code": "INTERNAL_ERROR", "details": "..." }` |

他ユーザーのリソースに対するアクセスは 403 ではなく **404** を返す（リソースの存在を漏らさないセキュリティ設計）。

---

## 3. 認証エンドポイント

### `GET/POST /api/auth/[...nextauth]`

**ファイル**: `app/api/auth/[...nextauth]/route.ts:1-3`

NextAuth v5 の組み込みハンドラ。Google OAuth のコールバック・サインイン・サインアウト処理を担う。
ミドルウェアの matcher から除外されており、未認証でもアクセス可能。

| 項目 | 内容 |
| --- | --- |
| メソッド | GET, POST |
| パス | `/api/auth/[...nextauth]` |
| 認可 | 不要（公開エンドポイント） |
| 実装 | `handlers`（`lib/auth/config.ts` の NextAuth インスタンスから export） |

---

## 4. 豆（Bean）エンドポイント

→ #32, #33

### `GET /api/beans`

**ファイル**: `app/api/beans/route.ts:26-34`

| 項目 | 内容 |
| --- | --- |
| メソッド | GET |
| パス | `/api/beans` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | なし |
| クエリパラメータ | なし |
| 成功レスポンス | `200 OK` + Bean 配列（認証ユーザーのもののみ） |
| エラー | `401` 未認証 |

### `POST /api/beans`

**ファイル**: `app/api/beans/route.ts:8-23`

| 項目 | 内容 |
| --- | --- |
| メソッド | POST |
| パス | `/api/beans` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | `upsertBeanSchema`（`app/beans/schema.ts`）に従う JSON |
| 成功レスポンス | `201 Created` + `{ "id": "<uuid>" }` |
| エラー | `401` 未認証 / `400` バリデーション失敗 |

**リクエストボディフィールド**（`upsertBeanSchema`）:

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | string | 必須 | 豆名（trim、空文字不可） |
| `roaster` | string | 必須 | ロースター名（trim、空文字不可） |
| `country` | enum | 必須 | `COUNTRIES` 定数の値のいずれか |
| `region` | string | 任意（省略時 `""`） | 生産地域 |
| `farm` | string | 任意（省略時 `""`） | 農園名 |
| `variety` | string | 任意（省略時 `""`） | 品種 |
| `process` | string | 任意（省略時 `""`） | 精製方法 |
| `roast` | enum | 必須 | `ROAST_LEVELS` 定数の値のいずれか |
| `priceJpy` | integer | 任意（省略時 `0`） | 価格（円、非負整数） |
| `notes` | string | 任意（省略時 `""`） | メモ |

### `GET /api/beans/[id]`

**ファイル**: `app/api/beans/[id]/route.ts:12-26`

| 項目 | 内容 |
| --- | --- |
| メソッド | GET |
| パス | `/api/beans/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | なし |
| 成功レスポンス | `200 OK` + Bean オブジェクト |
| エラー | `401` 未認証 / `404` 存在しない（他ユーザーのリソース含む） |

### `PUT /api/beans/[id]`

**ファイル**: `app/api/beans/[id]/route.ts:28-48`

| 項目 | 内容 |
| --- | --- |
| メソッド | PUT |
| パス | `/api/beans/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | `upsertBeanSchema` に従う JSON（POST と同一） |
| 成功レスポンス | `200 OK` + 更新後の Bean オブジェクト |
| エラー | `401` 未認証 / `400` バリデーション失敗 / `404` 存在しない |

### `DELETE /api/beans/[id]`

**ファイル**: `app/api/beans/[id]/route.ts:51-65`

| 項目 | 内容 |
| --- | --- |
| メソッド | DELETE |
| パス | `/api/beans/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | なし |
| 成功レスポンス | `204 No Content` |
| エラー | `401` 未認証 / `404` 存在しない |

関連する `brew` / `brew_flavor` も Repository 層のトランザクションで削除される（`docs/development-guide.md:178-183` 参照）。

---

## 5. 写真解析（Bean Extract）エンドポイント

→ #58, #61, #84

### `POST /api/beans/extract`

**ファイル**: `app/api/beans/extract/route.ts`

| 項目 | 内容 |
| --- | --- |
| メソッド | POST |
| パス | `/api/beans/extract` |
| 認可 | 要（`getAuthenticatedUser`。LLM API コストのため未認証不可） |
| Content-Type | `multipart/form-data` |
| Runtime | Node.js（`export const runtime = 'nodejs'`） |
| maxDuration | 30 秒（Vercel Pro プラン以上で有効） |

**リクエスト**:

`file` フィールドに JPEG または PNG 画像ファイルを添付する。サーバー側上限は 4.5 MB。

**成功レスポンス**: `200 OK`

```json
{
  "name": "Yirgacheffe Kochere",
  "roaster": "Onibus Coffee",
  "country": "Ethiopia",
  "region": "Yirgacheffe",
  "farm": "Kochere Washing Station",
  "variety": "Heirloom",
  "process": "Washed",
  "notes": "Jasmine, Blueberry, Citrus"
}
```

読み取れなかったフィールドは省略される（`undefined` はレスポンスに含まない）。

**エラーレスポンス**:

| ステータス | `code` | 条件 |
| --- | --- | --- |
| 400 | `INVALID_FILE` | ファイルなし・MIME タイプ違反 |
| 400 | `FILE_TOO_LARGE` | サイズが 4.5 MB 超 |
| 401 | — | 未認証 |
| 503 | `EXTRACTION_FAILED` | Anthropic API エラー・JSON パース失敗 |
| 500 | `INTERNAL_ERROR` | 予期しないサーバーエラー |

詳細アーキテクチャは `docs/photo-form-extraction.md` を参照。

---

## 6. 抽出ログ（Brew）エンドポイント

→ #62, #63, #78

### `GET /api/brews`

**ファイル**: `app/api/brews/route.ts:26-42`

| 項目 | 内容 |
| --- | --- |
| メソッド | GET |
| パス | `/api/brews` |
| 認可 | 要（`getAuthenticatedUser`） |
| クエリパラメータ | `?beanId=<id>`（省略時は全件取得） |
| 成功レスポンス | `200 OK` + Brew 配列（認証ユーザーのもののみ） |
| エラー | `401` 未認証 |

`?beanId=<id>` を指定すると、指定した豆に紐づく抽出のみを返す。

### `POST /api/brews`

**ファイル**: `app/api/brews/route.ts:8-24`

| 項目 | 内容 |
| --- | --- |
| メソッド | POST |
| パス | `/api/brews` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | `upsertBrewSchema`（`app/brews/schema.ts`）に従う JSON |
| 成功レスポンス | `201 Created` + `{ "id": "<uuid>" }` |
| エラー | `401` 未認証 / `400` バリデーション失敗 |

**リクエストボディフィールド**（`upsertBrewSchema`）:

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `beanId` | string | 必須 | 対象豆の ID |
| `beanWeight` | number | 必須 | 豆量（g、正数） |
| `beanGrind` | number | 任意（省略時 `0`） | 挽き目 |
| `waterWeight` | number | 必須 | 湯量（g、正数） |
| `waterTemp` | number | 任意（省略時 `0`） | 湯温（℃） |
| `steps` | BrewStep[] | 任意（省略時 `[]`） | 注湯ステップ配列 `[{ time, water }]` |
| `aroma` | integer | 必須 | 香り評価（0〜5） |
| `acidity` | integer | 必須 | 酸味評価（0〜5） |
| `sweetness` | integer | 必須 | 甘さ評価（0〜5） |
| `body` | integer | 必須 | ボディ評価（0〜5） |
| `overall` | integer | 必須 | 総合評価（0〜5） |
| `notes` | string | 任意（省略時 `""`） | メモ |
| `flavorIds` | string[] | 任意（省略時 `[]`） | 付与する風味タグの ID 配列 |

### `GET /api/brews/[id]`

**ファイル**: `app/api/brews/[id]/route.ts:12-26`

| 項目 | 内容 |
| --- | --- |
| メソッド | GET |
| パス | `/api/brews/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| 成功レスポンス | `200 OK` + Brew オブジェクト（Bean 情報・Flavor 一覧を含む） |
| エラー | `401` 未認証 / `404` 存在しない |

### `PUT /api/brews/[id]`

**ファイル**: `app/api/brews/[id]/route.ts:28-48`

| 項目 | 内容 |
| --- | --- |
| メソッド | PUT |
| パス | `/api/brews/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | `upsertBrewSchema` に従う JSON（POST と同一） |
| 成功レスポンス | `200 OK` + 更新後の Brew オブジェクト |
| エラー | `401` 未認証 / `400` バリデーション失敗 / `404` 存在しない |

### `DELETE /api/brews/[id]`

**ファイル**: `app/api/brews/[id]/route.ts:51-65`

| 項目 | 内容 |
| --- | --- |
| メソッド | DELETE |
| パス | `/api/brews/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| 成功レスポンス | `204 No Content` |
| エラー | `401` 未認証 / `404` 存在しない |

---

## 7. 抽出プリセット（Brew Preset）エンドポイント

→ #85, #109, PR #115

### `GET /api/brew-presets`

**ファイル**: `app/api/brew-presets/route.ts:8-16`

| 項目 | 内容 |
| --- | --- |
| メソッド | GET |
| パス | `/api/brew-presets` |
| 認可 | 要（`getAuthenticatedUser`） |
| 成功レスポンス | `200 OK` + BrewPreset 配列（認証ユーザーのもののみ） |
| エラー | `401` 未認証 |

### `POST /api/brew-presets`

**ファイル**: `app/api/brew-presets/route.ts:18-34`

| 項目 | 内容 |
| --- | --- |
| メソッド | POST |
| パス | `/api/brew-presets` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | `upsertBrewPresetSchema`（`app/brew-presets/schema.ts`）に従う JSON |
| 成功レスポンス | `201 Created` + `{ "id": "<uuid>" }` |
| エラー | `401` 未認証 / `400` バリデーション失敗 |

**リクエストボディフィールド**（`upsertBrewPresetSchema`）:

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | string | 必須 | プリセット名 |
| `description` | string | 任意（省略時 `""`） | プリセット説明 |
| `defaultBeanWeight` | number | 任意（省略時 `0`） | デフォルト豆量（g） |
| `defaultWaterTemp` | number | 任意（省略時 `0`） | デフォルト湯温（℃） |
| `steps` | BrewStep[] | 必須（1 件以上） | 注湯ステップ配列 `[{ time, water }]` |

### `GET /api/brew-presets/[id]`

**ファイル**: `app/api/brew-presets/[id]/route.ts:12-25`

| 項目 | 内容 |
| --- | --- |
| メソッド | GET |
| パス | `/api/brew-presets/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| 成功レスポンス | `200 OK` + BrewPreset オブジェクト |
| エラー | `401` 未認証 / `404` 存在しない |

### `PUT /api/brew-presets/[id]`

**ファイル**: `app/api/brew-presets/[id]/route.ts:28-48`

| 項目 | 内容 |
| --- | --- |
| メソッド | PUT |
| パス | `/api/brew-presets/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| リクエストボディ | `upsertBrewPresetSchema` に従う JSON（POST と同一） |
| 成功レスポンス | `200 OK` + 更新後の BrewPreset オブジェクト |
| エラー | `401` 未認証 / `400` バリデーション失敗 / `404` 存在しない |

### `DELETE /api/brew-presets/[id]`

**ファイル**: `app/api/brew-presets/[id]/route.ts:51-65`

| 項目 | 内容 |
| --- | --- |
| メソッド | DELETE |
| パス | `/api/brew-presets/:id` |
| 認可 | 要（`getAuthenticatedUser`） |
| 成功レスポンス | `204 No Content` |
| エラー | `401` 未認証 / `404` 存在しない |

---

## 8. 風味マスタ（Flavor）エンドポイント

→ #63

### `GET /api/flavors`

**ファイル**: `app/api/flavors/route.ts:7-15`

| 項目 | 内容 |
| --- | --- |
| メソッド | GET |
| パス | `/api/flavors` |
| 認可 | 要（`getAuthenticatedUser`） |
| 成功レスポンス | `200 OK` + Flavor 配列（全ユーザー共通の共有マスタ） |
| エラー | `401` 未認証 |

`flavor` は共有マスタのため `user_id` によるフィルタは行わない。全認証ユーザーに同じ一覧を返す。

---

## 9. エンドポイント一覧

| メソッド | パス | 認可 | 説明 |
| --- | --- | --- | --- |
| GET, POST | `/api/auth/[...nextauth]` | 不要 | NextAuth ハンドラ |
| GET | `/api/beans` | 要 | 豆一覧取得 |
| POST | `/api/beans` | 要 | 豆新規作成 |
| GET | `/api/beans/:id` | 要 | 豆単件取得 |
| PUT | `/api/beans/:id` | 要 | 豆更新 |
| DELETE | `/api/beans/:id` | 要 | 豆削除（関連 brew / brew_flavor も削除） |
| POST | `/api/beans/extract` | 要 | 写真から豆情報を抽出（Claude Vision） |
| GET | `/api/brews` | 要 | 抽出一覧取得（`?beanId` 絞り込み対応） |
| POST | `/api/brews` | 要 | 抽出新規作成 |
| GET | `/api/brews/:id` | 要 | 抽出単件取得（Bean + Flavor 含む） |
| PUT | `/api/brews/:id` | 要 | 抽出更新 |
| DELETE | `/api/brews/:id` | 要 | 抽出削除（関連 brew_flavor も削除） |
| GET | `/api/brew-presets` | 要 | プリセット一覧取得 |
| POST | `/api/brew-presets` | 要 | プリセット新規作成 |
| GET | `/api/brew-presets/:id` | 要 | プリセット単件取得 |
| PUT | `/api/brew-presets/:id` | 要 | プリセット更新 |
| DELETE | `/api/brew-presets/:id` | 要 | プリセット削除 |
| GET | `/api/flavors` | 要 | 風味マスタ一覧取得 |
