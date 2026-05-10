# API 仕様書

Brewia の HTTP API 仕様。すべてのエンドポイントは Next.js App Router の Route Handler として実装されており、エントリポイントは `app/api/**/route.ts` に配置される。

---

## 共通仕様

### ベースパスとレスポンス形式

- ベースパス: `/api`
- リクエスト / レスポンスとも JSON（`Content-Type: application/json`）
- 例外として `POST /api/beans/extract` のみ `multipart/form-data` を受け付ける

### 認証

すべてのエンドポイントは Auth.js セッションを必須とする（`/api/auth/*` を除く）。

| 状況 | ステータス | レスポンス |
| --- | --- | --- |
| 未認証 | 401 | `{ "error": "Unauthorized" }` |
| 他ユーザーのリソースを指定 | 404 | `{ "error": "<Resource> not found" }` |

403 は返さず、404 でリソースの存在を伏せる。

### エラーレスポンスの形式

| ステータス | 用途 | ボディ例 |
| --- | --- | --- |
| 400 | Zod バリデーション失敗 / 不正なファイル | `{ "error": "Invalid request body" }` |
| 401 | 未認証 | `{ "error": "Unauthorized" }` |
| 404 | 対象リソースなし or 他ユーザー所有 | `{ "error": "Bean not found" }` |
| 500 | サーバー内部エラー | `{ "error": "Internal error", "code": "INTERNAL_ERROR", "details": "..." }` |
| 503 | LLM の API / パースエラー | `{ "error": "Extraction failed", "code": "EXTRACTION_FAILED", "details": "..." }` |

`POST /api/beans/extract` のみ `code` フィールドを伴う構造化エラーを返す。

### 全エンドポイント一覧

| メソッド | パス | 用途 | スコープ |
| --- | --- | --- | --- |
| GET | `/api/beans` | 自分の豆一覧 | 認証ユーザー |
| POST | `/api/beans` | 豆作成 | 認証ユーザー |
| GET | `/api/beans/{id}` | 豆詳細 | 所有者 |
| PUT | `/api/beans/{id}` | 豆更新 | 所有者 |
| DELETE | `/api/beans/{id}` | 豆削除（カスケード） | 所有者 |
| POST | `/api/beans/extract` | 豆写真からのフィールド抽出 | 認証ユーザー |
| GET | `/api/brews` | 抽出一覧（`?beanId=` で絞り込み） | 認証ユーザー |
| POST | `/api/brews` | 抽出作成 | 認証ユーザー |
| GET | `/api/brews/{id}` | 抽出詳細（豆 / フレーバー結合） | 所有者 |
| PUT | `/api/brews/{id}` | 抽出更新 | 所有者 |
| DELETE | `/api/brews/{id}` | 抽出削除（中間テーブルも削除） | 所有者 |
| GET | `/api/brew-presets` | プリセット一覧 | 認証ユーザー |
| POST | `/api/brew-presets` | プリセット作成 | 認証ユーザー |
| GET | `/api/brew-presets/{id}` | プリセット詳細 | 所有者 |
| PUT | `/api/brew-presets/{id}` | プリセット更新 | 所有者 |
| DELETE | `/api/brew-presets/{id}` | プリセット削除 | 所有者 |
| GET | `/api/flavors` | フレーバーマスタ一覧 | 認証ユーザー |
| GET / POST | `/api/auth/[...nextauth]` | Auth.js のコールバック | 公開 |

## Beans API

### GET /api/beans

自分が登録した豆の一覧を返す。

| 項目 | 値 |
| --- | --- |
| 認証 | 必須 |
| クエリ | なし |
| 200 ボディ | `Bean[]` |

### POST /api/beans

豆を新規作成する。

| 項目 | 値 |
| --- | --- |
| 認証 | 必須 |
| リクエストボディ | `UpsertBeanDto`（後述） |
| 201 ボディ | `{ "id": "<uuid>" }` |
| 400 | バリデーションエラー |

### GET /api/beans/{id}

| 項目 | 値 |
| --- | --- |
| 200 ボディ | `Bean` |
| 404 | 存在しない / 他ユーザー所有 |

### PUT /api/beans/{id}

| 項目 | 値 |
| --- | --- |
| リクエストボディ | `UpsertBeanDto` |
| 200 ボディ | `Bean`（更新後） |
| 400 | バリデーションエラー |
| 404 | 対象なし |

### DELETE /api/beans/{id}

| 項目 | 値 |
| --- | --- |
| 204 | 削除成功 |
| 404 | 対象なし |

紐づく `brew` と `brew_flavor` も Repository のトランザクション内でカスケード削除される。

### POST /api/beans/extract

豆袋などの写真から豆フィールド候補を LLM で抽出する。

| 項目 | 値 |
| --- | --- |
| 認証 | 必須 |
| Content-Type | `multipart/form-data` |
| フィールド | `file`: 画像（`image/jpeg` または `image/png`、4.5 MB 以下） |
| 200 ボディ | `ExtractedBeanFields`（部分オブジェクト） |
| 400 | `INVALID_FILE` / `FILE_TOO_LARGE` |
| 503 | `EXTRACTION_FAILED`（LLM API / パースエラー） |
| 500 | `INTERNAL_ERROR` |
| 制限 | `runtime: nodejs`, `maxDuration: 30` 秒 |

レスポンスの `ExtractedBeanFields` は次の任意フィールドを含む（マッチしないものは省略）。

```json
{
  "name": "Yirgacheffe Konga",
  "roaster": "Light Up Coffee",
  "country": "Ethiopia",
  "region": "Yirgacheffe",
  "farm": "Konga Cooperative",
  "variety": "Heirloom",
  "process": "Washed",
  "roast": "City",
  "notes": "..."
}
```

LLM 出力は次のとおり正規化される。

- `country`: `COUNTRIES` に大文字小文字無視で一致するもののみ採用
- `process`: `PROCESSES` に完全一致するもののみ採用
- `roast`: `ROAST_LEVELS` に大文字小文字無視で一致するもののみ採用
- 文字列は `trim` され、空のものは省略

## Brews API

### GET /api/brews

| 項目 | 値 |
| --- | --- |
| クエリ | `beanId` (任意) |
| 200 ボディ（`beanId` なし） | `Brew[]` |
| 200 ボディ（`beanId` あり） | `BrewWithBean[]`（豆 + フレーバー結合） |

### POST /api/brews

| 項目 | 値 |
| --- | --- |
| リクエストボディ | `UpsertBrewDto`（後述） |
| 201 ボディ | `{ "id": "<uuid>" }` |
| 400 | バリデーションエラー |

`flavorIds` は重複除去された上で中間テーブル `brew_flavor` に挿入される。

### GET /api/brews/{id}

| 項目 | 値 |
| --- | --- |
| 200 ボディ | `BrewWithBean`（豆 + フレーバー一覧を含む） |
| 404 | 対象なし / 他ユーザー所有 |

### PUT /api/brews/{id}

`PUT /api/brews/:id` のレイヤ間処理は「データフロー」セクションのシーケンス図を参照。

| 項目 | 値 |
| --- | --- |
| リクエストボディ | `UpsertBrewDto` |
| 200 ボディ | `Brew`（更新後） |
| 400 / 404 | 通常のエラー |

更新時は中間テーブル `brew_flavor` を一旦全削除してから再作成する（差分更新ではなく全置換）。

### DELETE /api/brews/{id}

| 項目 | 値 |
| --- | --- |
| 204 | 削除成功 |
| 404 | 対象なし |

## Brew Presets API

### GET /api/brew-presets

ユーザーのプリセット一覧。固定 / 組み込みプリセットは存在しない。

### POST /api/brew-presets

| 項目 | 値 |
| --- | --- |
| リクエストボディ | `UpsertBrewPresetDto` |
| 201 ボディ | `{ "id": "<uuid>" }` |
| 400 | `steps` が空のとき / バリデーションエラー |

### GET /api/brew-presets/{id}

| 項目 | 値 |
| --- | --- |
| 200 ボディ | `BrewPreset` |
| 404 | 対象なし |

### PUT /api/brew-presets/{id}

通常の更新。`steps` 配列は最低 1 件必要。

### DELETE /api/brew-presets/{id}

通常の削除。

## Flavors API

### GET /api/flavors

全ユーザー共通のフレーバーマスタを返す。

| 項目 | 値 |
| --- | --- |
| 認証 | 必須（middleware が `/api/*` を保護するため） |
| 200 ボディ | `Flavor[]` |

`flavor` には `user_id` を持たせていない。アクセス制御は「Brew が当該ユーザーの所有である」ことで行う。

## Auth API

### GET / POST /api/auth/[...nextauth]

Auth.js が自動生成するハンドラ。次のサブパスを受け持つ。

- `/api/auth/signin` / `/api/auth/signout`
- `/api/auth/callback/google`
- `/api/auth/csrf`, `/api/auth/session`, `/api/auth/providers`

middleware の `matcher` は `/api/auth/*` を素通しさせる。

## リクエスト DTO

各 DTO は `app/<resource>/schema.ts` に Zod スキーマとして定義されている。

### UpsertBeanDto

| キー | 型 | 必須 | 制約 |
| --- | --- | --- | --- |
| `name` | string | ◯ | trim 後 1 文字以上 |
| `roaster` | string | ◯ | trim 後 1 文字以上 |
| `country` | enum | ◯ | `COUNTRIES`（19 + Blended） |
| `region` | string |  | 既定 `""` |
| `farm` | string |  | 既定 `""` |
| `variety` | string |  | 既定 `""` |
| `process` | string |  | 既定 `""` |
| `roast` | enum | ◯ | `ROAST_LEVELS`（8 段階） |
| `priceJpy` | number |  | 0 以上の整数。空文字 / null は 0 に正規化 |
| `notes` | string |  | 既定 `""` |

### UpsertBrewDto

| キー | 型 | 必須 | 制約 |
| --- | --- | --- | --- |
| `beanId` | string | ◯ | trim 後 1 文字以上 |
| `beanWeight` | number | ◯ | 正の数 |
| `beanGrind` | number |  | 0 以上 / 空文字は 0 |
| `waterWeight` | number | ◯ | 正の数 |
| `waterTemp` | number |  | 0–100 / 空文字は 0 |
| `steps` | `BrewStep[]` |  | 既定 `[]` |
| `aroma` | int | ◯ | 0–5 |
| `acidity` | int | ◯ | 0–5 |
| `sweetness` | int | ◯ | 0–5 |
| `body` | int | ◯ | 0–5 |
| `overall` | int | ◯ | 0–5 |
| `notes` | string |  | 既定 `""` |
| `flavorIds` | string[] |  | 既定 `[]`、サーバーで重複除去 |

`BrewStep` は `{ time: number(>=0), water: number(>=0) }`。

### UpsertBrewPresetDto

| キー | 型 | 必須 | 制約 |
| --- | --- | --- | --- |
| `name` | string | ◯ | trim 後 1 文字以上 |
| `description` | string |  | 既定 `""` |
| `defaultBeanWeight` | number |  | 0 以上 / 空文字は 0 |
| `defaultWaterTemp` | number |  | 0–100 / 空文字は 0 |
| `steps` | `BrewStep[]` | ◯ | 1 件以上 |

## レスポンス型

`lib/types.ts` を参照。代表的な型は次のとおり。

```typescript
type Bean = {
  id: string
  userId: string
  name: string
  country: Country
  region: string
  farm: string
  process: string
  variety: string
  roast: RoastLevel
  roaster: string
  priceJpy: number
  notes: string
  created: string
  updated: string
}

type Brew = {
  id: string
  userId: string
  beanId: string
  beanWeight: number
  beanGrind: number
  waterWeight: number
  waterTemp: number
  steps: BrewStep[]
  aroma: number
  acidity: number
  sweetness: number
  body: number
  overall: number
  notes: string
  created: string
  updated: string
}

type BrewWithBean = Brew & { bean: Bean; flavors: Flavor[] }

type BrewPreset = {
  id: string
  userId: string
  name: string
  description: string
  defaultBeanWeight: number
  defaultWaterTemp: number
  steps: BrewStep[]
  created: string
  updated: string
}

type Flavor = {
  id: string
  name: string
  category: string
  subcategory: string
  created: string
  updated: string
}
```

## データフロー

`PUT /api/brews/:id` のレイヤ間処理を示す。

```mermaid
sequenceDiagram
    participant Client
    participant Route as Route Handler
    participant Auth as getAuthenticatedUser
    participant Schema as upsertBrewSchema
    participant Service as BrewsService
    participant Repo as BrewsRepository
    participant DB

    Client->>Route: PUT /api/brews/:id (JSON)
    Route->>Auth: セッション取得
    Auth-->>Route: user or null
    alt 未認証
        Route-->>Client: 401
    end
    Route->>Schema: safeParse(json)
    alt バリデーションNG
        Route-->>Client: 400
    end
    Route->>Service: updateBrew(userId, id, dto)
    Service->>Repo: update(userId, id, input)
    Repo->>DB: BEGIN; UPDATE brew WHERE user_id; DELETE/INSERT brew_flavor; COMMIT
    DB-->>Repo: brewRow or undefined
    Repo-->>Service: Brew or undefined
    Service-->>Route: Brew or undefined
    alt 該当なし
        Route-->>Client: 404
    else
        Route-->>Client: 200 + JSON
    end
```

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

## Auth.js テーブル

`/api/auth/*` 経由で次のテーブルが操作される（直接の API は提供しない）。

- `user`, `account`, `session`, `verificationToken`

詳細は [data-spec.md](./data-spec.md) を参照。
