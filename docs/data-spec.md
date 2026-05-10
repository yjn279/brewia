# データ仕様書

Brewia の永続データ層と TypeScript 型の対応関係。物理スキーマは Turso（libSQL/SQLite）上で `lib/db/schema.ts` の Drizzle 定義として管理されている。

## 全体像

### ER 図

```mermaid
erDiagram
    user ||--o{ account : "linked auth providers"
    user ||--o{ session : "active sessions"
    user ||--o{ bean : "owns"
    user ||--o{ brew : "owns"
    user ||--o{ brew_preset : "owns"
    bean ||--o{ brew : "brewed as"
    brew ||--o{ brew_flavor : "tagged with"
    flavor ||--o{ brew_flavor : "assigned to"

    user {
        text id PK
        text name
        text email UK
        integer emailVerified
        text image
    }
    account {
        text userId FK
        text type
        text provider
        text providerAccountId
        text refresh_token
        text access_token
        integer expires_at
        text token_type
        text scope
        text id_token
        text session_state
    }
    session {
        text sessionToken PK
        text userId FK
        integer expires
    }
    verificationToken {
        text identifier
        text token
        integer expires
    }
    bean {
        text id PK
        text user_id FK
        text name
        text country
        text region
        text farm
        text process
        text variety
        text roast
        text roaster
        integer price_jpy
        text notes
        text created
        text updated
    }
    brew {
        text id PK
        text user_id FK
        text bean_id FK
        real bean_weight
        real bean_grind
        real water_weight
        real water_temp
        text steps
        integer aroma
        integer acidity
        integer sweetness
        integer body
        integer overall
        text notes
        text created
        text updated
    }
    flavor {
        text id PK
        text name
        text category
        text subcategory
        text created
        text updated
    }
    brew_flavor {
        text id PK
        text brew_id FK
        text flavor_id FK
        text created
        text updated
    }
    brew_preset {
        text id PK
        text user_id FK
        text name
        text description
        real default_bean_weight
        real default_water_temp
        text steps
        text created
        text updated
    }
```

### テナント境界

`brew_flavor` は `brew` が必ず `user_id` を持つため JOIN で所有者を一意に決定できる。中間テーブルに `user_id` を重複保持するとアクセス制御の不整合バグの温床になるので持たせない。

| テーブル | テナントスコープ | 備考 |
| --- | --- | --- |
| `user` | グローバル | 認証 ID の発行元 |
| `account`, `session`, `verificationToken` | グローバル | Auth.js が管理 |
| `bean` | `user_id` | 所有者のみアクセス可 |
| `brew` | `user_id` | 所有者のみアクセス可 |
| `brew_preset` | `user_id` | 所有者のみアクセス可 |
| `flavor` | グローバル（共有マスタ） | 全ユーザーで共通 |
| `brew_flavor` | `brew.user_id` 経由 | 中間テーブル。直接の `user_id` は持たない |

## ドメインテーブル

### bean

コーヒー豆（焙煎済み）の登録レコード。ユーザーが手入力または写真から自動抽出して登録し、`GET /api/beans` および `/` ホーム画面から一覧表示される。豆を削除すると紐づく `brew` と `brew_flavor` も連鎖削除される。

| 列 | 型 | NOT NULL | 既定 | 概要 |
| --- | --- | --- | --- | --- |
| `id` | text PK | ◯ | UUID v7 | 主キー |
| `user_id` | text FK→`user.id` | ◯ | — | 所有者 |
| `name` | text | ◯ | — | 豆名 |
| `country` | text | ◯ | — | 生産国（`COUNTRIES` の値） |
| `region` | text | ◯ | `''` | 生産地域 |
| `farm` | text | ◯ | `''` | 農園 / ステーション |
| `process` | text | ◯ | `''` | 精製方法（`PROCESSES` の値、または空文字） |
| `variety` | text | ◯ | `''` | 品種 |
| `roast` | text | ◯ | — | 焙煎度（`ROAST_LEVELS` の値） |
| `roaster` | text | ◯ | `''` | ロースター名 |
| `price_jpy` | integer | ◯ | `0` | 購入価格（JPY、0 は未入力扱い） |
| `notes` | text | ◯ | `''` | 自由記述メモ |
| `created` | text | ◯ | `CURRENT_TIMESTAMP` | 作成日時 |
| `updated` | text | ◯ | `CURRENT_TIMESTAMP` | 更新日時 |

### brew

1 回の抽出ログ。豆量・湯量・注湯ステップ・5 軸味覚評価を保持する。`GET /api/brews` や `/beans/{id}` の抽出履歴から読み取られ、`POST /api/brews` で作成される。更新時は `brew_flavor` の中間テーブルを全置換する。

| 列 | 型 | NOT NULL | 既定 | 概要 |
| --- | --- | --- | --- | --- |
| `id` | text PK | ◯ | UUID v7 | 主キー |
| `user_id` | text FK→`user.id` | ◯ | — | 所有者 |
| `bean_id` | text FK→`bean.id` | ◯ | — | 紐づく豆 |
| `bean_weight` | real | ◯ | — | 豆量 (g) |
| `bean_grind` | real | ◯ | `0` | 挽き目（クリック値、0 は未入力） |
| `water_weight` | real | ◯ | — | 総湯量 (g/ml) |
| `water_temp` | real | ◯ | `0` | 湯温 (°C、0 は未入力) |
| `steps` | text | ◯ | — | `BrewStep[]` の JSON 文字列 |
| `aroma` | integer | ◯ | — | 香り評価 0–5 |
| `acidity` | integer | ◯ | — | 酸味評価 0–5 |
| `sweetness` | integer | ◯ | — | 甘さ評価 0–5 |
| `body` | integer | ◯ | — | ボディ評価 0–5 |
| `overall` | integer | ◯ | — | 総合評価 0–5（0 はカップ未評価のドラフト） |
| `notes` | text | ◯ | `''` | テイスティングノート |
| `created` | text | ◯ | `CURRENT_TIMESTAMP` | 作成日時 |
| `updated` | text | ◯ | `CURRENT_TIMESTAMP` | 更新日時 |

`steps` は `[{ "time": 0, "water": 0 }, { "time": 30, "water": 40 }, ...]` の形式で保持する。

### flavor

全ユーザー共通の風味タグマスタ。`user_id` を持たず、`GET /api/flavors` で全件取得される。抽出登録画面のフレーバー選択 UI から参照され、`brew_flavor` を通じて抽出ログに紐づく。

| 列 | 型 | NOT NULL | 既定 | 概要 |
| --- | --- | --- | --- | --- |
| `id` | text PK | ◯ | UUID v7 | 主キー |
| `name` | text | ◯ | — | 風味名（例: Citrus） |
| `category` | text | ◯ | — | 大分類 |
| `subcategory` | text | ◯ | — | 小分類 |
| `created` | text | ◯ | `CURRENT_TIMESTAMP` | — |
| `updated` | text | ◯ | `CURRENT_TIMESTAMP` | — |

### brew_flavor

`brew` と `flavor` の多対多中間テーブル。抽出 1 件に複数のフレーバータグを紐づける。更新時は対象 `brew_id` の全行を削除してから再挿入する全置換方式を採る。`user_id` は持たず、アクセス制御は `brew.user_id` 経由で行う。

| 列 | 型 | NOT NULL | 既定 | 概要 |
| --- | --- | --- | --- | --- |
| `id` | text PK | ◯ | UUID v7 | 主キー |
| `brew_id` | text FK→`brew.id` | ◯ | — | 抽出側 |
| `flavor_id` | text FK→`flavor.id` | ◯ | — | フレーバー側 |
| `created` | text | ◯ | `CURRENT_TIMESTAMP` | — |
| `updated` | text | ◯ | `CURRENT_TIMESTAMP` | — |

更新時は対象 `brew_id` の行を全削除してから再挿入する。差分更新ではなく全置換となる。

### brew_preset

抽出レシピのひな形。名前・説明・既定湯温・抽出ステップを保持し、抽出フォームの「Extraction Steps」ヘッダから保存・呼び出しができる。`GET /api/brew-presets` で一覧取得、`/presets` 画面から編集・削除される。

| 列 | 型 | NOT NULL | 既定 | 概要 |
| --- | --- | --- | --- | --- |
| `id` | text PK | ◯ | UUID v7 | 主キー |
| `user_id` | text FK→`user.id` | ◯ | — | 所有者 |
| `name` | text | ◯ | — | プリセット名 |
| `description` | text | ◯ | `''` | 説明 |
| `default_bean_weight` | real | ◯ | `0` | 既定豆量 (g)。0 は未指定 |
| `default_water_temp` | real | ◯ | `0` | 既定湯温 (°C)。0 は未指定 |
| `steps` | text | ◯ | — | `BrewStep[]` の JSON 文字列、最低 1 件 |
| `created` | text | ◯ | `CURRENT_TIMESTAMP` | — |
| `updated` | text | ◯ | `CURRENT_TIMESTAMP` | — |

## Auth.js テーブル

`@auth/drizzle-adapter` の SQLite スキーマに準拠。アプリ側ロジックでは直接操作せず、Auth.js のコールバック内で読み書きされる。

### user

認証ユーザーの基本情報。Google OAuth サインイン時に Auth.js が自動作成し、`account` / `session` の親レコードとなる。アプリ側は `user.id` を `bean.user_id` / `brew.user_id` の外部キーとして参照する。

| 列 | 型 | NOT NULL | 既定 | 概要 |
| --- | --- | --- | --- | --- |
| `id` | text PK | ◯ | — | 主キー |
| `name` | text | — | — | 表示名 |
| `email` | text UNIQUE | ◯ | — | メールアドレス |
| `emailVerified` | integer (timestamp_ms) | — | — | 検証日時 |
| `image` | text | — | — | プロフィール画像 URL |

### account

OAuth プロバイダ（Google）との接続情報。`userId` で `user` に紐づき、プロバイダ側のアクセストークンやリフレッシュトークンを保持する。プライマリキーは `(provider, providerAccountId)` の複合キー。

| 列 | 型 | NOT NULL | 概要 |
| --- | --- | --- | --- |
| `userId` | text FK→`user.id` ON DELETE CASCADE | ◯ | ユーザー |
| `type` | text | ◯ | OAuth など |
| `provider` | text | ◯ | `google` 等 |
| `providerAccountId` | text | ◯ | プロバイダ側 ID |
| `refresh_token` | text | — | — |
| `access_token` | text | — | — |
| `expires_at` | integer | — | — |
| `token_type` | text | — | — |
| `scope` | text | — | — |
| `id_token` | text | — | — |
| `session_state` | text | — | — |

主キーは `(provider, providerAccountId)` の複合キー。

### session

ログイン中のセッションを管理する。`sessionToken` を Cookie に保持し、Auth.js がリクエストごとに検証する。有効期限（`expires`）を過ぎると無効となる。

| 列 | 型 | NOT NULL | 概要 |
| --- | --- | --- | --- |
| `sessionToken` | text PK | ◯ | セッショントークン |
| `userId` | text FK→`user.id` ON DELETE CASCADE | ◯ | — |
| `expires` | integer (timestamp_ms) | ◯ | 期限 |

### verificationToken

Email Magic Link 認証用の検証トークン。Magic Link は PR #107 / #113 で廃止されたため現在は使われないが、`@auth/drizzle-adapter` のスキーマ仕様に従い定義を維持する。プライマリキーは `(identifier, token)` の複合キー。

| 列 | 型 | NOT NULL | 概要 |
| --- | --- | --- | --- |
| `identifier` | text | ◯ | メールアドレス等 |
| `token` | text | ◯ | トークン |
| `expires` | integer (timestamp_ms) | ◯ | 期限 |

主キーは `(identifier, token)` の複合キー。

Email Magic Link の廃止により（`#107`, `#113`）、`verificationToken` の運用上の出番は無い。テーブル自体は Auth.js のスキーマ定義のために残す。

## ID とタイムスタンプ

- 主キーは UUID v7 を `uuidv7()` で生成。Drizzle の `$defaultFn` でアプリ側が値を埋める
- `created` / `updated` は ISO 8601 文字列。`created` は `CURRENT_TIMESTAMP` をデフォルト、`updated` はアプリ側で `new Date().toISOString()` を都度セット
- Auth.js の時刻列のみ `integer (timestamp_ms)` を採用（アダプタ仕様）

## TypeScript 型との対応

`lib/types.ts` に定義された型がアプリ全体で利用される。

| 型 | 対応テーブル / 構造 | 備考 |
| --- | --- | --- |
| `Bean` | `bean` 行 | DB 値そのまま |
| `Brew` | `brew` 行 | `steps` は JSON.parse 済みの `BrewStep[]` |
| `BrewStep` | `brew.steps` 配列要素 | `{ time: number, water: number }` |
| `Flavor` | `flavor` 行 | — |
| `BrewFlavor` | `brew_flavor` 行 | アプリでは直接利用せず |
| `BeanWithBrews` | `Bean` + `brews: Brew[]` | 結合型 |
| `BrewWithBean` | `Brew` + `bean: Bean` + `flavors: Flavor[]` | 詳細表示用 |
| `BrewPresetRecord` | `brew_preset` 行 | `app/brew-presets/repository.ts` で定義 |

### 列挙値

| 列挙 | 値 |
| --- | --- |
| `ROAST_LEVELS` | `Light` / `Cinnamon` / `Medium` / `High` / `City` / `Full City` / `French` / `Italian` |
| `PROCESSES` | `Washed` / `Natural` / `Honey` / `Anaerobic` / `Wet Hulled` |
| `COUNTRIES` | `Brazil` / `Burundi` / `Colombia` / `Costa Rica` / `El Salvador` / `Ethiopia` / `Guatemala` / `Honduras` / `Indonesia` / `Jamaica` / `Kenya` / `Nicaragua` / `Panama` / `Papua New Guinea` / `Rwanda` / `Tanzania` / `Vietnam` / `Yemen` / `Blended` |

`process` のみ DB 上の制約は単なる `text NOT NULL`。バリデーションは Zod スキーマと UI 側 select で行う。

## インデックスと制約

現在のスキーマに明示的なセカンダリインデックスは無い（`drizzle/0000_*`–`0005_*`）。クエリは PK / 主要 FK 経由のため SQLite の自動インデックスで済んでいる。スケール時のホットスポットは次の見直し対象になる。

- `bean(user_id, updated)` — 一覧の `ORDER BY updated DESC`
- `brew(user_id, created)` — 一覧 / 統計
- `brew(bean_id)` — 豆ごとの抽出取得 / カウント
- `brew_flavor(brew_id)` — 中間テーブルの逆引き / 削除

参照整合性は `references()` 経由で FK 宣言済み。`account.userId` と `session.userId` は `ON DELETE CASCADE`。それ以外（`bean.user_id`, `brew.user_id`, `brew.bean_id`, `brew_flavor.brew_id`, `brew_flavor.flavor_id`, `brew_preset.user_id`）は明示的な ON DELETE 指定なし。連鎖削除はアプリの Repository 層がトランザクション内で行う。

