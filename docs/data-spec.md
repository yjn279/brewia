Brewia のデータは SQLite（Turso）に保存され、Drizzle ORM でアクセスします。以下は Sprint 4 完了後の現実のスキーマに基づいた仕様です。

## Entity relationship overview

`user` は複数の `bean` と `brew` を持ちます。`bean` には複数の `brew` が紐づきます。`brew` は複数の `brew_flavor` を持ち、`brew_flavor` は `flavor` と結合します。`session` は `user` に紐づくセッションレコードです。

## Tables

### user

ユーザーアカウントを管理するテーブルです。

| column        | type        | constraints         |
| :------------ | :---------- | :------------------ |
| id            | text        | PK, uuidv7          |
| email         | text        | NOT NULL, UNIQUE    |
| password_hash | text        | NOT NULL            |
| password_salt | text        | NOT NULL            |
| created       | text        | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated       | text        | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### session

アクティブなセッションを管理するテーブルです。

| column     | type | constraints                |
| :--------- | :--- | :------------------------- |
| id         | text | PK, uuidv7                 |
| user_id    | text | NOT NULL, FK → user.id     |
| expires_at | text | NOT NULL (ISO 8601)        |
| created    | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### bean

コーヒー豆の情報を管理するテーブルです。

| column    | type    | constraints                |
| :-------- | :------ | :------------------------- |
| id        | text    | PK, uuidv7                 |
| user_id   | text    | NOT NULL, FK → user.id     |
| name      | text    | NOT NULL                   |
| country   | text    | NOT NULL (Country enum 値) |
| region    | text    | nullable                   |
| farm      | text    | nullable                   |
| process   | text    | nullable                   |
| variety   | text    | nullable                   |
| roast     | text    | NOT NULL (RoastLevel enum 値) |
| roaster   | text    | nullable                   |
| price_jpy | integer | nullable                   |
| notes     | text    | nullable                   |
| created   | text    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated   | text    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### brew

抽出ログを管理するテーブルです。

| column      | type    | constraints                |
| :---------- | :------ | :------------------------- |
| id          | text    | PK, uuidv7                 |
| user_id     | text    | NOT NULL, FK → user.id     |
| bean_id     | text    | NOT NULL, FK → bean.id     |
| bean_weight | real    | NOT NULL                   |
| bean_grind  | real    | nullable                   |
| water_weight | real   | NOT NULL                   |
| water_temp  | real    | nullable                   |
| steps       | text    | NOT NULL (JSON 配列)       |
| aroma       | integer | NOT NULL (0-5)             |
| acidity     | integer | NOT NULL (0-5)             |
| sweetness   | integer | NOT NULL (0-5)             |
| body        | integer | NOT NULL (0-5)             |
| overall     | integer | NOT NULL (0-5)             |
| notes       | text    | nullable                   |
| created     | text    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated     | text    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

`steps` カラムは `[{ time: number, water: number }]` の JSON 配列を格納します。`time` は秒、`water` は累計グラム数を表します。

### brew_flavor

抽出ログとフレーバーのアソシエーションテーブルです。

| column    | type | constraints              |
| :-------- | :--- | :----------------------- |
| id        | text | PK, uuidv7               |
| brew_id   | text | NOT NULL, FK → brew.id   |
| flavor_id | text | NOT NULL, FK → flavor.id |
| created   | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated   | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### flavor

フレーバーマスターテーブルです。アプリ起動時にシードデータで初期化され、user スコープはありません。

| column      | type | constraints |
| :---------- | :--- | :---------- |
| id          | text | PK, uuidv7  |
| name        | text | NOT NULL    |
| category    | text | NOT NULL    |
| subcategory | text | NOT NULL    |
| created     | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated     | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

## TypeScript types

以下は `lib/types.ts` で定義されているクライアント・サーバー共通の型定義です。

`Bean` インターフェースは `id`, `userId`（DBのみ）, `name`, `country`（`Country` 型）, `region`, `farm`, `process`, `variety`, `roast`（`RoastLevel` 型）, `roaster`, `priceJpy`（number | null）, `notes`, `created`, `updated` を持ちます。

`Country` 型は `COUNTRIES` 配列の要素型で、Bolivia から Zimbabwe まで 31 の生産国と Blended を含みます。`COUNTRY_FLAGS` 定数はすべての `Country` 値に対応する国旗絵文字を持ちます。

`RoastLevel` 型は `ROAST_LEVELS` 配列の要素型で、Light, Cinnamon, Medium, High, City, Full City, French, Italian の 8 段階です。

`BrewStep` は `{ time: number; water: number }` のシンプルな型です。

`BrewPreset` は `lib/brew-presets.ts` で定義されており、`id`, `name`, `description`, `defaultBeanWeight?`, `defaultWaterTemp?`, `steps: BrewStep[]` を持ちます。固定プリセットは `BREW_PRESETS` 定数として 5 種類提供されます。

## Migrations

マイグレーションファイルは `drizzle/` ディレクトリに配置されています。

| file                          | description                         |
| :---------------------------- | :---------------------------------- |
| 0000_heavy_gladiator.sql      | 初期スキーマ（bean, brew, flavor, brew_flavor） |
| 0001_broad_colleen_wing.sql   | bean テーブルに price_jpy カラムを追加 |
| 0002_clever_carlie_cooper.sql | user/session テーブル追加、bean/brew に user_id 追加（既存データは legacy ユーザーに紐づけ） |
