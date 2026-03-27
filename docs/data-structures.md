# Data Structures

`lib/types.ts` の型情報を、変数名・型・日本語名称・説明で整理しています。

## Bean

| 変数名 | 型 | 日本語名称 | 説明 |
| --- | --- | --- | --- |
| id | string | 豆ID | 豆を一意に識別するID |
| name | string | 豆名 | コーヒー豆の名称 |
| country | string | 生産国 | 豆の生産国 |
| region | string | 生産地域 | 豆の生産地域 |
| farm | string | 農園名 | 生産農園 |
| process | string | 精製方法 | ウォッシュト/ナチュラルなど |
| variety | string | 品種 | コーヒー豆の品種 |
| roast | number | 焙煎度 | 1-5の焙煎レベル |
| roaster | string | ロースター | 焙煎した店舗/ブランド名 |
| notes | string | メモ | 豆に関する自由記述 |
| created | string | 作成日時 | レコード作成日時 |
| updated | string | 更新日時 | レコード更新日時 |

## Brew

| 変数名 | 型 | 日本語名称 | 説明 |
| --- | --- | --- | --- |
| id | string | 抽出ID | 抽出ログを一意に識別するID |
| beanId | string | 豆ID | 紐づく Bean のID |
| beanWeight | number | 豆量 | 使用した豆の重量（g） |
| beanGrind | number | 挽き目 | 挽き目の指標値 |
| waterWeight | number | 湯量 | 使用した総湯量（g/ml） |
| waterTemp | number | 湯温 | 抽出時の湯温（℃） |
| steps | BrewStep[] | 注湯ステップ | 時間と注湯量の配列データ |
| aroma | number | 香り | 香りの評価（1-5） |
| acidity | number | 酸味 | 酸味の評価（1-5） |
| sweetness | number | 甘さ | 甘さの評価（1-5） |
| body | number | ボディ | コク/質感の評価（1-5） |
| overall | number | 総合 | 総合評価（1-5） |
| notes | string | メモ | 抽出に関する自由記述 |
| created | string | 作成日時 | レコード作成日時 |
| updated | string | 更新日時 | レコード更新日時 |

## BrewStep（JSON構造）

```json
[
  { "time": 0, "water": 0 },
  { "time": 30, "water": 40 },
  { "time": 60, "water": 120 },
  { "time": 90, "water": 180 },
  { "time": 120, "water": 225 }
]
```

| 変数名 | 型 | 日本語名称 | 説明 |
| --- | --- | --- | --- |
| time | number | 経過時間 | 抽出開始からの経過秒数 |
| water | number | 累計注湯量 | その時点までの累計注湯量 |

## Flavor

| 変数名 | 型 | 日本語名称 | 説明 |
| --- | --- | --- | --- |
| id | string | フレーバーID | フレーバーを一意に識別するID |
| name | string | フレーバー名 | 風味名（例: Citrus） |
| category | string | カテゴリ | 大分類 |
| subcategory | string | サブカテゴリ | 小分類 |
| created | string | 作成日時 | レコード作成日時 |
| updated | string | 更新日時 | レコード更新日時 |

## BrewFlavor

| 変数名 | 型 | 日本語名称 | 説明 |
| --- | --- | --- | --- |
| id | string | 紐づけID | Brew と Flavor の関連ID |
| brewId | string | 抽出ID | 紐づく Brew のID |
| flavorId | string | フレーバーID | 紐づく Flavor のID |
| created | string | 作成日時 | レコード作成日時 |
| updated | string | 更新日時 | レコード更新日時 |

## Joined Types

| 型名 | ベース型 | 追加プロパティ | 説明 |
| --- | --- | --- | --- |
| BeanWithBrews | Bean | `brews: Brew[]` | Bean に紐づく抽出一覧を含む型 |
| BrewWithBean | Brew | `bean: Bean`, `flavors: Flavor[]` | 抽出ログに豆情報と風味一覧を含む型 |

## Data

```mermaid
erDiagram
    BEAN ||--o{ BREW : has
    BREW ||--o{ BREW_FLAVOR : tagged_with
    FLAVOR ||--o{ BREW_FLAVOR : assigned_to

    BEAN {
        string id PK
        string name
        string country
        string region
        string farm
        string process
        string variety
        int roast
        string roaster
        text notes
        datetime created
        datetime updated
    }

    BREW {
        string id PK
        string bean_id FK
        decimal bean_weight
        decimal bean_grind
        decimal water_weight
        decimal water_temp
        text steps
        int aroma
        int acidity
        int sweetness
        int body
        int overall
        text notes
        datetime created
        datetime updated
    }

    FLAVOR {
        string id PK
        string name
        string category
        string subcategory
        datetime created
        datetime updated
    }

    BREW_FLAVOR {
        string id PK
        string brew_id FK
        string flavor_id FK
        datetime created
        datetime updated
    }
```

