# Brewia 画面仕様書（現行実装ベース）

最終更新: 2026-03-28  
対象: `app/` および `components/` に存在する現行画面実装

---

## 1. 目的と適用範囲

本書は、Brewia の**現行UI実装**に基づき、以下を体系化する。

- 画面遷移（Mermaid）
- 全体要件（機能・非機能）
- 共通仕様（レイアウト、ナビゲーション、入力、表示）
- 画面単位の要件・仕様（入出力、UI構成、イベント、バリデーション、遷移）
- 実装上の制約・注意点

> 注記: 本仕様は「現在のコードがどう振る舞うか」を定義する。将来要件ではなく、実装仕様の可視化を目的とする。

---

## 2. 画面一覧

| 画面ID | 画面名 | ルート | 役割 |
|---|---|---|---|
| SCR-HOME | ホーム | `/` | サマリー表示、豆一覧、新規登録導線 |
| SCR-NEW | 新規作成 | `/new` | 「抽出ログ作成」と「豆登録」をタブで切替 |
| SCR-BEAN-DETAIL | 豆詳細 | `/beans/[id]` | 豆情報表示、紐づく抽出履歴表示、抽出作成導線 |
| SCR-BREW-DETAIL | 抽出詳細 | `/brews/[id]` | 抽出パラメータ、注湯プロファイル、味覚評価、メモ表示 |

補足（現行挙動）:
- 新規作成フォーム送信後の遷移先は `/beans` および `/brews` だが、当該一覧ルートの画面実装は存在しない。

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

## 4. 全体要件

### 4.1 機能要件（現行）

1. 豆情報を登録できること（SCR-NEW > Add Bean タブ）。
2. 抽出ログを登録できること（SCR-NEW > Log Brew タブ）。
3. ホームで統計値（抽出数・豆数・国数・平均評価）を表示できること。
4. 豆詳細で豆情報と当該豆の抽出履歴を閲覧できること。
5. 抽出詳細で抽出条件・注湯ステップ・味覚評価・フレーバー・ノートを閲覧できること。
6. URLパラメータで初期表示状態を指定できること（`type`, `bean`）。

### 4.2 非機能要件（現行UI設計から読み取れる要件）

1. モバイルファーストであること（`max-w-md` ベースの中央カラム）。
2. ヘッダーは基本 sticky で、上部固定かつ薄いブラー背景を持つこと。
3. カードベースUI（`rounded-xl`, `shadow-sm`）で情報をセクション化すること。
4. 数値入力（g, °C, clicks, rating）は即時視認しやすい表示であること。
5. タッチ操作を想定し、主要アクションを十分なタップ領域で配置すること。

---

## 5. 共通仕様

### 5.1 レイアウト仕様

- 画面全体は `min-h-screen`。
- 本文幅は `max-w-md`。
- 左右余白 `px-4`、縦余白 `py-6` を基準とする。
- 情報ブロックはカード化し、見出しは小文字大文字混在のUI文言（英語）を使用。

### 5.2 ナビゲーション仕様

- 戻る導線は左上アイコンボタンを基本とする。
- 主要遷移は `next/link` によるクライアント遷移。
- 一部導線はクエリ文字列で初期状態を受け渡す。
  - `/new?type=bean`
  - `/new?type=brew&bean=<beanId>`

### 5.3 エラーハンドリング仕様

- `getBeanById` / `getBrewById` が取得失敗時は `notFound()` を呼び出す。
- 入力フォームは HTML `required` と `min/max/step` を中心に基本バリデーションを実施。

### 5.4 データ仕様（UIが依存する属性）

- Bean: `id, name, roaster, country, region, farm, variety, process, roast, notes, updated`
- Brew: `id, bean, created, beanWeight, waterWeight, waterTemp, beanGrind, steps, aroma, acidity, sweetness, body, overall, flavors, notes`
- 固定マスタ:
  - 国リスト/国旗マップ
  - 焙煎レベル配列
  - フレーバー一覧

---

## 6. 画面別要件・仕様

---

## 6.1 SCR-HOME（`/`）

### 6.1.1 目的

- ユーザーの現状（統計）と豆ライブラリへの入口を提示するハブ画面。

### 6.1.2 UI構成

1. ヘッダー
   - タイトル「Brewia」
   - 右上 `+` ボタン（`/new?type=bean`）
2. ウェルカム領域
   - 時間帯に応じた挨拶コンポーネント
   - サブテキスト
3. 統計グリッド（2x2）
   - Total Brews
   - Bean Varieties
   - Countries
   - Avg Rating（小数1桁）
4. Bean Library
   - 更新日降順で豆カードを表示

### 6.1.3 表示ロジック

- `totalBrews = brews.length`
- `totalBeans = beans.length`
- `uniqueCountries = Set(beans.country).size`
- `avgRating = (sum(brew.overall) / totalBrews).toFixed(1)`
- `beans` は `updated` 降順でソートして描画

### 6.1.4 画面イベント

- `+` 押下 -> SCR-NEW（beanタブ初期）
- BeanCard 押下 -> SCR-BEAN-DETAIL

### 6.1.5 注意点

- `totalBrews = 0` の場合、平均値算出で `NaN` の可能性がある（現行コードはガードなし）。

---

## 6.2 SCR-NEW（`/new`）

### 6.2.1 目的

- 豆登録と抽出登録を1画面に集約し、タブで作業切替できるようにする。

### 6.2.2 UI構成

1. ヘッダー
   - 戻るボタン（`/`）
   - タイトル「New Entry」
2. タブスイッチャ
   - `Log Brew`
   - `Add Bean`
3. タブ内容
   - `Log Brew` -> `NewBrewForm`
   - `Add Bean` -> `NewBeanForm`

### 6.2.3 初期表示仕様（クエリ依存）

- `type=bean` なら Bean タブ初期表示
- それ以外は Brew タブ初期表示
- `bean=<id>` は Brewフォームの初期選択豆として渡す

### 6.2.4 状態遷移仕様

- `searchParams` の変更に追従してタブ状態を同期する。

---

## 6.3 SCR-NEW（Add Bean タブ / NewBeanForm）

### 6.3.1 目的

- 新しい豆情報を登録する。

### 6.3.2 入力項目仕様

#### A. Bean Info
- Name（必須）
- Roaster（必須）

#### B. Origin
- Country（必須、セレクト）
- Region（任意）
- Farm / Station（任意）

#### C. Characteristics
- Variety（任意）
- Process（任意、固定選択肢）
- Roast Level（スライダー: 焙煎レベル配列インデックス）

#### D. Notes
- Notes（任意、複数行テキスト）

### 6.3.3 バリデーション仕様

- Name, Roaster は `required`
- Country はセレクト必須
- その他は任意

### 6.3.4 送信仕様

- 送信時にローディング状態へ遷移（`Saving...`）
- 疑似API待機1秒
- 完了後 `router.push('/beans')`

### 6.3.5 注意点

- `/beans` ルート未実装のため、現行では遷移先が404相当になる。

---

## 6.4 SCR-NEW（Log Brew タブ / NewBrewForm）

### 6.4.1 目的

- 豆を選択して抽出ログを登録する。

### 6.4.2 入力項目仕様

#### A. Select Bean
- 豆セレクト（必須）
- 選択肢は `beans` 配列から生成
- `initialBeanId` が与えられた場合は初期選択

#### B. Parameters
- Coffee(g)（必須、数値、`min=1`, `step=0.1`）
- Water(g)（必須、数値、`min=1`, `step=1`）
- Temp(°C)（必須、数値、`min=80`, `max=100`）
- Grind(clicks)（必須、数値、`min=1`）
- Brew Ratio（表示専用、`water / bean` を小数1桁）

#### C. Taste Profile
- Aroma, Acidity, Sweetness, Body, Overall
- 各スライダー範囲: 1〜5（整数）
- ラベル表示: `数値 - 評価語`

#### D. Flavor Notes
- フレーバータグをトグル選択
- 選択時は強調表示し、`X` アイコンを表示

#### E. Tasting Notes
- 任意テキスト

### 6.4.3 バリデーション仕様

- Bean / Parameters 各項目は必須
- 数値範囲は HTML 属性で制約
- 比率は表示計算（入力欠損時 `-`）

### 6.4.4 送信仕様

- 送信時ローディング表示（`Saving...`）
- 疑似API待機1秒
- 完了後 `router.push('/brews')`

### 6.4.5 注意点

- `/brews` ルート未実装のため、現行では遷移先が404相当になる。

---

## 6.5 SCR-BEAN-DETAIL（`/beans/[id]`）

### 6.5.1 目的

- 特定豆の基本情報と抽出履歴を集約表示する。

### 6.5.2 前提条件

- URLの `id` に対応する Bean が存在すること。
- 存在しない場合 `notFound()`。

### 6.5.3 UI構成

1. ヘッダー
   - 戻る（`/`）
   - タイトル「Bean Details」
   - 右上 `+`（`/new?type=brew&bean=<id>`）
2. Bean Hero
   - 国旗、豆名、ロースター、焙煎レベル
3. Origin
   - Region / Country
   - Producer（farm がある場合）
   - Variety / Process
4. Notes（存在時のみ）
5. Brew History（件数>0時のみ）
   - `BrewCard` を縦並び

### 6.5.4 画面イベント

- `+` 押下 -> SCR-NEW（Brewタブ、該当豆を初期選択）
- BrewCard 押下 -> SCR-BREW-DETAIL

---

## 6.6 SCR-BREW-DETAIL（`/brews/[id]`）

### 6.6.1 目的

- 抽出1件のレシピ条件・官能評価・注湯情報を詳細表示する。

### 6.6.2 前提条件

- URLの `id` に対応する Brew が存在すること。
- 存在しない場合 `notFound()`。

### 6.6.3 UI構成

1. ヘッダー
   - 戻る（`/beans/<bean.id>`）
   - タイトル「Brew Details」
   - 右側に作成日（`en-US` ロケール、`Mon DD, YYYY`相当）
2. Bean Reference カード
   - 豆情報（国旗、豆名、ロースター）
   - Overall スコア（`/5`）
3. Parameters カード
   - Coffee / Water / Temperature / Grind
   - Brew Ratio `1:x.x`
4. Pour Profile
   - `PourChart` に `steps` と `totalWater` を渡して描画
5. Taste Profile
   - `TasteRadar` に5軸評価を渡して描画
6. Flavor Notes（存在時のみ）
7. Tasting Notes（存在時のみ）

### 6.6.4 画面イベント

- ヘッダー戻る -> SCR-BEAN-DETAIL
- Bean Reference 押下 -> SCR-BEAN-DETAIL

---

## 7. 主要クエリパラメータ仕様

| パラメータ | 利用画面 | 型 | 意味 | 既定値 |
|---|---|---|---|---|
| `type` | `/new` | `bean \| brew` | 初期タブ制御 | `brew` |
| `bean` | `/new` | `string` | Brew作成時の初期豆ID | `''` |

ルール:
- `type` が `bean` / `brew` 以外の場合は `brew` 扱い。
- `bean` が無効値でもフォーム自体は表示される（選択状態のみ影響）。

---

## 8. コンポーネント責務（画面仕様観点）

| コンポーネント | 責務 |
|---|---|
| `Greeting` | ホームでの挨拶表示 |
| `StatsCard` | 指標のラベル+値+アイコン表示 |
| `BeanCard` | 豆概要表示と豆詳細への導線 |
| `BrewCard` | 抽出概要表示と抽出詳細への導線 |
| `NewEntryTabs` | 新規作成タブ管理（URL同期） |
| `NewBeanForm` | 豆登録入力・検証・送信状態管理 |
| `NewBrewForm` | 抽出登録入力・検証・送信状態管理 |
| `RoastLevel` | 焙煎レベル可視化 |
| `PourChart` | 注湯ステップの可視化 |
| `TasteRadar` | 味覚5指標のレーダー表示 |

---

## 9. 既知の制約・改善候補

1. **送信後遷移先未実装**: `/beans`, `/brews` が未実装。
2. **平均評価ゼロ除算**: 抽出0件時の `avgRating` 表示不整合リスク。
3. **永続化未接続**: 登録処理は疑似API待機で、実データ保存は未実装。
4. **文言統一**: UI文言が英語中心、README等は日本語中心のため、運用方針を定義余地あり。

---

## 10. 受け入れ観点（現行仕様準拠チェックリスト）

- [ ] `/` で統計4指標と豆一覧が表示される。
- [ ] `/new?type=bean` で Add Bean タブが初期表示される。
- [ ] `/new?type=brew&bean=<id>` で Log Brew タブ + 豆初期選択が有効。
- [ ] `/beans/<id>` で豆情報と抽出履歴（存在時）が表示される。
- [ ] `/brews/<id>` で抽出パラメータ・注湯・味覚・フレーバー・ノート（存在時）が表示される。
- [ ] 不正な `<id>` は Not Found になる。

