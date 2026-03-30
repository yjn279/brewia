# Brewia 要件定義書（現行実装ベース）

## 1. 機能要件

### 1.1 画面要件

#### SCR-HOME（`/`）

**入力要件**

| 入力種別 | 入力名 | 形式 | 必須 | 説明 |
|---|---|---|---|---|
| データソース | beans | Bean配列 | Yes | 豆一覧表示、豆数・国数計算に利用 |
| データソース | brews | Brew配列 | Yes | 抽出数・平均評価計算に利用 |
| ユーザー操作 | `+`ボタン押下 | クリック | No | 新規登録画面へ遷移 |
| ユーザー操作 | BeanCard押下 | クリック | No | 豆詳細画面へ遷移 |

**出力要件**

| 出力種別 | 出力名 | 形式 | 説明 |
|---|---|---|---|
| 画面表示 | 統計カード | 数値4項目 | Total Brews / Bean Varieties / Countries / Avg Rating を表示 |
| 画面表示 | Bean Library | カード一覧 | `updated` 降順で豆カードを表示 |
| 画面遷移 | 新規作成導線 | URL遷移 | `/new?type=bean` |
| 画面遷移 | 豆詳細導線 | URL遷移 | `/beans/[id]` |

---

#### SCR-NEW（`/new`）

**入力要件**

| 入力種別 | 入力名 | 形式 | 必須 | 説明 |
|---|---|---|---|---|
| クエリ | `type` | `bean \| brew` | No | 初期タブ制御。未指定/不正は `brew` 扱い |
| クエリ | `bean` | string | No | Brewフォーム初期選択豆ID |
| ユーザー操作 | タブ選択 | クリック | No | Log Brew / Add Bean を切替 |
| ユーザー操作 | 戻る押下 | クリック | No | ホームへ戻る |

**出力要件**

| 出力種別 | 出力名 | 形式 | 説明 |
|---|---|---|---|
| 画面表示 | タブUI | 2タブ | Log Brew / Add Bean を表示 |
| 画面表示 | フォーム本体 | コンポーネント切替 | `NewBrewForm` or `NewBeanForm` を表示 |
| 画面遷移 | 戻る導線 | URL遷移 | `/` |

---

#### SCR-NEW / NewBeanForm

**入力要件**

| 入力種別 | 入力名 | 形式 | 必須 | 制約 |
|---|---|---|---|---|
| フォーム | Name | text | Yes | Bean名 |
| フォーム | Roaster | text | Yes | ロースター名 |
| フォーム | Country | select | Yes | 国選択 |
| フォーム | Region | text | No | 産地地域 |
| フォーム | Farm / Station | text | No | 生産者情報 |
| フォーム | Variety | text | No | 品種 |
| フォーム | Process | select | No | プロセス選択 |
| フォーム | Roast Level | slider | No | 焙煎度 |
| フォーム | Notes | textarea | No | メモ |
| ユーザー操作 | Submit | click | Yes | 登録送信 |

**出力要件**

| 出力種別 | 出力名 | 形式 | 説明 |
|---|---|---|---|
| UI状態 | 送信中表示 | ボタン文言 | `Saving...` とローディング表示 |
| 処理結果 | 送信後遷移 | URL遷移 | `/beans` へ遷移（現状ルート未実装） |

---

#### SCR-NEW / NewBrewForm

**入力要件**

| 入力種別 | 入力名 | 形式 | 必須 | 制約 |
|---|---|---|---|---|
| フォーム | Bean | select | Yes | 抽出対象豆 |
| フォーム | Coffee | number | Yes | `min=1`, `step=0.1` |
| フォーム | Water | number | Yes | `min=1`, `step=1` |
| フォーム | Temp | number | Yes | `min=80`, `max=100` |
| フォーム | Grind | number | Yes | `min=1` |
| フォーム | Aroma/Acidity/Sweetness/Body/Overall | slider | Yes | 各 `1-5` |
| フォーム | Flavor Notes | toggle chips | No | 複数選択 |
| フォーム | Tasting Notes | textarea | No | メモ |
| ユーザー操作 | Submit | click | Yes | 登録送信 |

**出力要件**

| 出力種別 | 出力名 | 形式 | 説明 |
|---|---|---|---|
| 画面表示 | Brew Ratio | 計算表示 | `water / bean` を小数1桁で表示 |
| UI状態 | 送信中表示 | ボタン文言 | `Saving...` とローディング表示 |
| 処理結果 | 送信後遷移 | URL遷移 | `/brews` へ遷移（現状ルート未実装） |

---

#### SCR-BEAN-DETAIL（`/beans/[id]`）

**入力要件**

| 入力種別 | 入力名 | 形式 | 必須 | 説明 |
|---|---|---|---|---|
| パス | `id` | string | Yes | 豆ID |
| データソース | Bean | オブジェクト | Yes | `id` に対応する豆 |
| データソース | Brew List | 配列 | No | 対象豆の抽出履歴 |
| ユーザー操作 | `+`押下 | クリック | No | 抽出新規作成へ遷移 |
| ユーザー操作 | BrewCard押下 | クリック | No | 抽出詳細へ遷移 |

**出力要件**

| 出力種別 | 出力名 | 形式 | 説明 |
|---|---|---|---|
| 画面表示 | Bean Hero | カード | 国旗/豆名/ロースター/焙煎度 |
| 画面表示 | Origin | セクション | Region/Country/Producer/Variety/Process |
| 画面表示 | Brew History | カード一覧 | 抽出履歴がある場合のみ表示 |
| 画面遷移 | 抽出新規作成導線 | URL遷移 | `/new?type=brew&bean=<id>` |
| エラー出力 | Not Found | エラーページ | `id` 不正時に返却 |

---

#### SCR-BREW-DETAIL（`/brews/[id]`）

**入力要件**

| 入力種別 | 入力名 | 形式 | 必須 | 説明 |
|---|---|---|---|---|
| パス | `id` | string | Yes | 抽出ID |
| データソース | Brew | オブジェクト | Yes | `id` に対応する抽出 |
| ユーザー操作 | 戻る押下 | クリック | No | 豆詳細へ遷移 |
| ユーザー操作 | Bean Reference押下 | クリック | No | 豆詳細へ遷移 |

**出力要件**

| 出力種別 | 出力名 | 形式 | 説明 |
|---|---|---|---|
| 画面表示 | Header Date | 日付表示 | `en-US` ロケールで作成日表示 |
| 画面表示 | Parameters | セクション | Coffee/Water/Temp/Grind/Brew Ratio |
| 画面表示 | Pour Profile | チャート | `steps`, `totalWater` を可視化 |
| 画面表示 | Taste Profile | レーダー | aroma/acidity/sweetness/body/overall |
| 画面表示 | Flavor Notes / Tasting Notes | 可変セクション | データ存在時のみ表示 |
| エラー出力 | Not Found | エラーページ | `id` 不正時に返却 |

### 1.2 API要件

> 現行実装は永続化API未接続のため、将来実装を前提とした要件定義を記載する。

#### Bean API

**入力要件**

| API | 入力 | 形式 | 必須 | 説明 |
|---|---|---|---|---|
| Create Bean | request body | JSON | Yes | `name, roaster, country` 必須 |
| Get Bean | path `id` | string | Yes | 豆詳細取得 |
| List Beans | query | optional | No | ソート/フィルタ拡張余地 |

**出力要件**

| API | 出力 | 形式 | 説明 |
|---|---|---|---|
| Create Bean | created resource | JSON | 作成済みBeanオブジェクトを返却 |
| Get Bean | bean resource | JSON | 単一Beanを返却。未存在時404 |
| List Beans | bean list | JSON array | Bean配列を返却 |

#### Brew API

**入力要件**

| API | 入力 | 形式 | 必須 | 説明 |
|---|---|---|---|---|
| Create Brew | request body | JSON | Yes | `beanId`, 抽出パラメータ、評価を受け取る |
| Get Brew | path `id` | string | Yes | 抽出詳細取得 |
| List Brews by Bean | query `beanId` | string | Yes | 豆別抽出履歴取得 |

**出力要件**

| API | 出力 | 形式 | 説明 |
|---|---|---|---|
| Create Brew | created resource | JSON | 作成済みBrewオブジェクトを返却 |
| Get Brew | brew resource | JSON | 単一Brewを返却。未存在時404 |
| List Brews by Bean | brew list | JSON array | Beanに紐づくBrew配列を返却 |

### 1.3 その他要件

| 区分 | 要件 |
|---|---|
| バリデーション | 数値入力は画面上の制約（`min/max/step`）と整合すること |
| ルーティング | 不正ID時に画面破綻せず Not Found を返すこと |
| UI整合 | ホーム統計値・詳細表示値がデータソースと一致すること |
| 既知制約 | `/beans`, `/brews` 一覧ルートは未実装であることを前提に運用すること |

