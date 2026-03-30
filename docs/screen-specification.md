# Brewia 画面仕様書（現行実装ベース）

最終更新: 2026-03-28  
関連文書: 要件は `docs/requirements-definition.md` を参照

---

## 1. 文書目的

本書は、Brewia の現行実装における**画面仕様（どの画面が、どう表示・遷移・入力するか）**を定義する。

---

## 2. 画面一覧

| 画面ID | 画面名 | ルート | 概要 |
|---|---|---|---|
| SCR-HOME | ホーム | `/` | サマリー表示、豆一覧、新規登録導線 |
| SCR-NEW | 新規作成 | `/new` | 抽出登録 / 豆登録をタブ切替 |
| SCR-BEAN-DETAIL | 豆詳細 | `/beans/[id]` | 豆情報と抽出履歴を表示 |
| SCR-BREW-DETAIL | 抽出詳細 | `/brews/[id]` | 抽出条件・評価・注湯・メモを表示 |

---

## 3. 画面遷移図（Mermaid）

```mermaid
flowchart TD
    HOME[SCR-HOME<br/>/] -->|+ ボタン| NEW_BEAN[/new?type=bean]
    HOME -->|Bean Card選択| BEAN_DETAIL[SCR-BEAN-DETAIL<br/>/beans/:beanId]

    NEW_GENERIC[SCR-NEW<br/>/new] -->|タブ切替| NEW_BREW_FORM[NewBrewForm]
    NEW_GENERIC -->|タブ切替| NEW_BEAN_FORM[NewBeanForm]

    BEAN_DETAIL -->|ヘッダー +| NEW_BREW[/new?type=brew&bean=:beanId]
    BEAN_DETAIL -->|Brew Card選択| BREW_DETAIL[SCR-BREW-DETAIL<br/>/brews/:brewId]

    BREW_DETAIL -->|戻る| BEAN_DETAIL
    NEW_GENERIC -->|戻る| HOME

    NEW_BEAN_FORM -->|保存成功| BEANS_LIST_MISSING[/beans (未実装ルート)]
    NEW_BREW_FORM -->|保存成功| BREWS_LIST_MISSING[/brews (未実装ルート)]

    BEAN_DETAIL -->|id不正| NOT_FOUND1[Not Found]
    BREW_DETAIL -->|id不正| NOT_FOUND2[Not Found]
```

---

## 4. 共通画面仕様

### 4.1 レイアウト
- 全画面でモバイル幅を基準に中央寄せ単一カラム。
- ヘッダーは sticky で上部固定。
- 本文はカード単位でセクション化。

### 4.2 ナビゲーション
- 戻るはヘッダー左上アイコン。
- 画面遷移は `Link` によるクライアント遷移。
- 新規作成画面はクエリパラメータで初期状態を制御。

### 4.3 エラー表示
- 詳細画面でID不正時は `notFound()`。

### 4.4 クエリ仕様

| パラメータ | 対象 | 意味 | 既定値 |
|---|---|---|---|
| `type` | `/new` | 初期タブ（`bean` / `brew`） | `brew` |
| `bean` | `/new` | Brewフォーム初期選択豆ID | 空文字 |

---

## 5. 画面別仕様

## 5.1 SCR-HOME（`/`）

### 目的
- 活動サマリー提示と各画面への起点提供。

### UI構成
1. ヘッダー
   - タイトル「Brewia」
   - 右上 `+`（`/new?type=bean`）
2. ウェルカム領域
3. 統計グリッド（2x2）
   - Total Brews / Bean Varieties / Countries / Avg Rating
4. Bean Library
   - 更新日降順で `BeanCard` を表示

### 表示ロジック
- `totalBrews = brews.length`
- `totalBeans = beans.length`
- `uniqueCountries = Set(country).size`
- `avgRating = (overall合計 / totalBrews).toFixed(1)`

### イベント
- `+` 押下 -> SCR-NEW（beanタブ）
- BeanCard 押下 -> SCR-BEAN-DETAIL

### 備考
- 抽出0件時、Avg Ratingは不整合表示リスクあり。

---

## 5.2 SCR-NEW（`/new`）

### 目的
- 豆登録と抽出登録を1画面で切替可能にする。

### UI構成
1. ヘッダー
   - 戻る（`/`）
   - タイトル「New Entry」
2. タブ
   - `Log Brew`
   - `Add Bean`
3. コンテンツ
   - `Log Brew` -> `NewBrewForm`
   - `Add Bean` -> `NewBeanForm`

### 初期表示
- `type=bean` の場合のみ Bean タブ、その他は Brew タブ。
- `bean=<id>` は Brewタブの初期選択豆として使用。

### イベント
- タブ押下でフォーム切替。
- 戻る押下で SCR-HOME。

---

## 5.3 NewBeanForm（SCR-NEW内）

### 入力セクション
1. Bean Info
   - Name（必須）
   - Roaster（必須）
2. Origin
   - Country（必須）
   - Region（任意）
   - Farm / Station（任意）
3. Characteristics
   - Variety（任意）
   - Process（任意）
   - Roast Level（スライダー）
4. Notes（任意）

### 送信仕様
- Submit時 `Saving...` を表示。
- 疑似待機1秒後、`/beans` へ遷移。

### 制約
- `/beans` ルートは未実装。

---

## 5.4 NewBrewForm（SCR-NEW内）

### 入力セクション
1. Select Bean
   - Bean選択（必須）
2. Parameters
   - Coffee(g): `min=1`, `step=0.1`
   - Water(g): `min=1`, `step=1`
   - Temp(°C): `min=80`, `max=100`
   - Grind(clicks): `min=1`
   - Brew Ratio（表示専用）
3. Taste Profile
   - Aroma / Acidity / Sweetness / Body / Overall（各1〜5）
4. Flavor Notes
   - タグのトグル選択
5. Tasting Notes（任意）

### 送信仕様
- Submit時 `Saving...` を表示。
- 疑似待機1秒後、`/brews` へ遷移。

### 制約
- `/brews` ルートは未実装。

---

## 5.5 SCR-BEAN-DETAIL（`/beans/[id]`）

### 前提
- `id` に対応する Bean が存在すること（無効時 Not Found）。

### UI構成
1. ヘッダー
   - 戻る（`/`）
   - タイトル「Bean Details」
   - 右上 `+`（`/new?type=brew&bean=<id>`）
2. Bean Hero
   - 国旗 / 豆名 / ロースター / RoastLevel
3. Origin
   - Region / Country / Producer / Variety / Process
4. Notes（存在時）
5. Brew History（存在時）
   - `BrewCard` リスト

### イベント
- `+` 押下 -> SCR-NEW（Brewタブ、豆初期選択）
- BrewCard 押下 -> SCR-BREW-DETAIL

---

## 5.6 SCR-BREW-DETAIL（`/brews/[id]`）

### 前提
- `id` に対応する Brew が存在すること（無効時 Not Found）。

### UI構成
1. ヘッダー
   - 戻る（`/beans/<bean.id>`）
   - タイトル「Brew Details」
   - 日付（`en-US` ロケール表示）
2. Bean Reference
   - 国旗 / 豆名 / ロースター / overall
3. Parameters
   - Coffee / Water / Temperature / Grind / Brew Ratio
4. Pour Profile
   - `PourChart(steps, totalWater)`
5. Taste Profile
   - `TasteRadar(aroma, acidity, sweetness, body, overall)`
6. Flavor Notes（存在時）
7. Tasting Notes（存在時）

### イベント
- 戻る押下 -> SCR-BEAN-DETAIL
- Bean Reference押下 -> SCR-BEAN-DETAIL

---

## 6. コンポーネント責務（画面仕様観点）

| コンポーネント | 画面責務 |
|---|---|
| `Greeting` | ホーム挨拶表示 |
| `StatsCard` | 指標表示 |
| `BeanCard` | 豆サマリー表示・豆詳細導線 |
| `BrewCard` | 抽出サマリー表示・抽出詳細導線 |
| `NewEntryTabs` | 新規画面タブ管理 |
| `NewBeanForm` | 豆登録入力/送信状態管理 |
| `NewBrewForm` | 抽出登録入力/送信状態管理 |
| `RoastLevel` | 焙煎度可視化 |
| `PourChart` | 注湯可視化 |
| `TasteRadar` | 味覚可視化 |

