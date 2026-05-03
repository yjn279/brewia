# Brewia データ仕様書

データベースは Turso/SQLite を使用しており、アプリケーションからは Drizzle ORM 経由でアクセスする。スキーマ定義は `lib/db/schema.ts` に集約されており、テーブルとアプリケーション型のマッピングも同ファイル内の型推論で管理されている。

## テーブル概要

Brewia のデータベースは `bean`・`brew`・`flavor`・`brew_flavor` の 4 テーブルで構成されている。`bean` は豆マスター、`brew` は抽出記録、`flavor` は風味タグマスターである。`brew_flavor` は `brew` と `flavor` の多対多関係を表す中間テーブルで、1 つの抽出記録に複数の風味タグを紐づけることを可能にしている。

## bean テーブル

豆の基本情報を保持するマスターテーブルである。1 レコードが 1 つのコーヒー豆に対応する。

| カラム名 | 物理カラム | 型 | NOT NULL | 既定値 | 説明 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| id | id | TEXT | YES | uuidv7() | 主キー |
| name | name | TEXT | YES | — | 豆名 |
| country | country | TEXT | YES | — | 産地国（COUNTRIES 列挙値） |
| region | region | TEXT | NO | NULL | 産地地域 |
| farm | farm | TEXT | NO | NULL | 農園名 |
| process | process | TEXT | NO | NULL | 精製処理方法 |
| variety | variety | TEXT | NO | NULL | 品種 |
| roast | roast | TEXT | YES | — | 焙煎度（ROAST_LEVELS 列挙値） |
| roaster | roaster | TEXT | NO | NULL | ロースター名 |
| notes | notes | TEXT | NO | NULL | メモ |
| created | created | TEXT | YES | CURRENT_TIMESTAMP | 作成日時（ISO8601） |
| updated | updated | TEXT | YES | CURRENT_TIMESTAMP | 更新日時（ISO8601） |

## brew テーブル

抽出記録を保持するテーブルである。1 レコードが 1 回の抽出セッションに対応し、`bean_id` で `bean` テーブルを参照する。`steps` カラムは `BrewStep[]` 型の配列をそのまま保存するのではなく、`app/brews/repository.ts:119` の `JSON.stringify(input.steps)` で示されるとおり、JSON 文字列にシリアライズして TEXT カラムに保存している。読み取り時は同リポジトリ内でパースして `BrewStep[]` に復元される。

| カラム名 | 物理カラム | 型 | NOT NULL | 既定値 | 説明 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| id | id | TEXT | YES | uuidv7() | 主キー |
| beanId | bean_id | TEXT | YES | — | 豆 ID（bean.id への外部キー） |
| beanWeight | bean_weight | REAL | YES | — | 豆量（グラム） |
| beanGrind | bean_grind | REAL | NO | NULL | 挽き目（クリック数） |
| waterWeight | water_weight | REAL | YES | — | 湯量（グラム） |
| waterTemp | water_temp | REAL | NO | NULL | 湯温（摂氏、0–100） |
| steps | steps | TEXT | YES | — | ポアプロファイル（JSON 文字列） |
| aroma | aroma | INTEGER | YES | — | アロマ評価（0–5 の整数） |
| acidity | acidity | INTEGER | YES | — | 酸味評価（0–5 の整数） |
| sweetness | sweetness | INTEGER | YES | — | 甘味評価（0–5 の整数） |
| body | body | INTEGER | YES | — | ボディ評価（0–5 の整数） |
| overall | overall | INTEGER | YES | — | 総合評価（0–5 の整数） |
| notes | notes | TEXT | NO | NULL | テイスティングメモ |
| created | created | TEXT | YES | CURRENT_TIMESTAMP | 作成日時（ISO8601） |
| updated | updated | TEXT | YES | CURRENT_TIMESTAMP | 更新日時（ISO8601） |

## flavor テーブル

風味タグのマスターデータを保持するテーブルである。各タグはカテゴリとサブカテゴリで分類されており、抽出記録から複数選択して紐づけられる。

| カラム名 | 物理カラム | 型 | NOT NULL | 既定値 | 説明 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| id | id | TEXT | YES | uuidv7() | 主キー |
| name | name | TEXT | YES | — | 風味タグ名 |
| category | category | TEXT | YES | — | カテゴリ（例: Fruity） |
| subcategory | subcategory | TEXT | YES | — | サブカテゴリ（例: Berry） |
| created | created | TEXT | YES | CURRENT_TIMESTAMP | 作成日時（ISO8601） |
| updated | updated | TEXT | YES | CURRENT_TIMESTAMP | 更新日時（ISO8601） |

## brew_flavor テーブル

`brew` と `flavor` の多対多関係を表す中間テーブルである。1 つの抽出記録に複数の風味タグを関連付けることができ、1 つの風味タグは複数の抽出記録に紐づき得る。抽出記録が削除される際は、この中間テーブルの対応レコードも連鎖削除される。

| カラム名 | 物理カラム | 型 | NOT NULL | 既定値 | 説明 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| id | id | TEXT | YES | uuidv7() | 主キー |
| brewId | brew_id | TEXT | YES | — | 抽出 ID（brew.id への外部キー） |
| flavorId | flavor_id | TEXT | YES | — | 風味タグ ID（flavor.id への外部キー） |
| created | created | TEXT | YES | CURRENT_TIMESTAMP | 作成日時（ISO8601） |
| updated | updated | TEXT | YES | CURRENT_TIMESTAMP | 更新日時（ISO8601） |

## TypeScript 型

アプリケーション層では `lib/types.ts` で定義された以下の TypeScript インターフェースを使用する。

`Bean` インターフェースはコーヒー豆エンティティを表す型で、`lib/types.ts:54` に定義されている。`roast` フィールドの型は `RoastLevel`（文字列の列挙型）であり、数値型ではない。

| フィールド | 型 | 説明 |
| :-- | :-- | :-- |
| id | string | 豆 ID |
| name | string | 豆名 |
| country | Country | 産地国 |
| region | string または null | 産地地域 |
| farm | string または null | 農園名 |
| process | string または null | 精製処理方法 |
| variety | string または null | 品種 |
| roast | RoastLevel | 焙煎度 |
| roaster | string または null | ロースター名 |
| notes | string または null | メモ |
| created | string | 作成日時（ISO8601 文字列） |
| updated | string | 更新日時（ISO8601 文字列） |

`BrewStep` インターフェースはポアプロファイルの 1 ステップを表す型で、`lib/types.ts:69` に定義されている。

| フィールド | 型 | 説明 |
| :-- | :-- | :-- |
| time | number | 経過時間（秒） |
| water | number | その時点での累積湯量（グラム） |

`Brew` インターフェースは抽出記録エンティティを表す型で、`lib/types.ts:74` に定義されている。

| フィールド | 型 | 説明 |
| :-- | :-- | :-- |
| id | string | 抽出 ID |
| beanId | string | 豆 ID |
| beanWeight | number | 豆量（グラム） |
| beanGrind | number または null | 挽き目（クリック数） |
| waterWeight | number | 湯量（グラム） |
| waterTemp | number または null | 湯温（摂氏） |
| steps | BrewStep[] | ポアプロファイル |
| aroma | number | アロマ評価（1–5 スケール） |
| acidity | number | 酸味評価 |
| sweetness | number | 甘味評価 |
| body | number | ボディ評価 |
| overall | number | 総合評価 |
| notes | string または null | テイスティングメモ |
| created | string | 作成日時（ISO8601 文字列） |
| updated | string | 更新日時（ISO8601 文字列） |

`Flavor` インターフェースは風味タグエンティティを表す型で、`lib/types.ts:92` に定義されている。

| フィールド | 型 | 説明 |
| :-- | :-- | :-- |
| id | string | 風味タグ ID |
| name | string | 風味タグ名 |
| category | string | カテゴリ |
| subcategory | string | サブカテゴリ |
| created | string | 作成日時（ISO8601 文字列） |
| updated | string | 更新日時（ISO8601 文字列） |

`BrewFlavor` インターフェースは `brew` と `flavor` の中間エンティティを表す型で、`lib/types.ts:101` に定義されている。

| フィールド | 型 | 説明 |
| :-- | :-- | :-- |
| id | string | 中間レコード ID |
| brewId | string | 抽出 ID |
| flavorId | string | 風味タグ ID |
| created | string | 作成日時（ISO8601 文字列） |
| updated | string | 更新日時（ISO8601 文字列） |

`BeanWithBrews` インターフェースは `lib/types.ts:109` に定義されており、`Bean` を継承して `brews: Brew[]` フィールドを追加した複合型である。豆詳細ページなど、豆に紐づく抽出一覧を合わせて取得する場面で使用する。

`BrewWithBean` インターフェースは `lib/types.ts:113` に定義されており、`Brew` を継承して `bean: Bean` と `flavors: Flavor[]` フィールドを追加した複合型である。抽出詳細ページや `GET /api/brews/{id}` のレスポンスで使用する。

## 列挙値

`PROCESSES` は豆の精製処理方法の選択肢を定義した定数配列で、`lib/types.ts:1` に定義されている。

| 値 |
| :-- |
| Washed |
| Natural |
| Honey |
| Anaerobic |
| Wet Hulled |

`ROAST_LEVELS` は焙煎度の選択肢を定義した定数配列で、`lib/types.ts:11` に定義されている。

| 値 |
| :-- |
| Light |
| Cinnamon |
| Medium |
| High |
| City |
| Full City |
| French |
| Italian |

`COUNTRIES` は産地国の選択肢を定義した定数配列で、`lib/types.ts:24` に定義されている。

| 値 |
| :-- |
| Ethiopia |
| Kenya |
| Colombia |
| Brazil |
| Guatemala |
| Panama |
| Costa Rica |
| Indonesia |
| Rwanda |
| Yemen |
| Blended |

`COUNTRY_FLAGS` は各国コードに対応する国旗絵文字を保持する Record 型で、`lib/types.ts:40` に定義されている。各 `Country` キーに対して国旗の Unicode 絵文字が対応付けられており、UI での表示に使用される。

## ID 採番方針

全テーブルの `id` カラムは UUIDv7 を採用している。Drizzle ORM の `$defaultFn(() => uuidv7())` でデフォルト関数として設定しており（`lib/db/schema.ts:6` ほか）、レコード挿入時にアプリケーション側で UUID が生成されてカラムに書き込まれる。UUIDv7 は時刻順にソート可能な特性を持つ。

## タイムスタンプ

全テーブルの `created` カラムと `updated` カラムは、どちらも TEXT 型として定義されており、ISO8601 形式の文字列を保存する。`created` はデフォルト値として SQLite の `CURRENT_TIMESTAMP` が設定されており、挿入時に自動セットされる。`updated` はレコード更新時にアプリケーション側（例: `app/beans/repository.ts:62` の `new Date().toISOString()`）で明示的に ISO8601 文字列を書き込む設計になっている。
