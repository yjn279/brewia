# Brewia 画面仕様書

Brewia は Next.js App Router を使用しており、すべてのページは `app/` ディレクトリ配下の `page.tsx` ファイルとして定義されている。ほとんどのページは `export const dynamic = 'force-dynamic'` を設定したサーバーコンポーネントであり、サーバー側でデータ取得を行ってから HTML を返す。画面遷移はすべて Next.js の `<Link>` コンポーネントで実装されている。

## ホーム

`/` に対応するルートで、`app/page.tsx` が担当するアプリケーションのトップページである。ページ上部に固定ヘッダー（アプリ名「Brewia」と新規豆登録への「+」ボタン）を配置する。

主要 UI 要素は以下のとおりである。

- Greeting コンポーネント（挨拶表示）
- Stats エリア（Total Brews 数と Bean Variety 数を 2 カラムグリッドで表示する StatsCard）
- Bean Library セクション（登録済みの豆を BeanCard で一覧表示）
- 空状態（豆が 0 件の場合は Empty コンポーネントで「No beans yet」とAdd your first bean リンクを表示）

遷移先は `/new?type=bean`（ヘッダーの「+」ボタンおよび空状態の CTA）と、各 BeanCard のクリックによる `/beans/{id}` である。データ取得は `beansService.getBeans()` と `brewsService.getBrews()` をサーバー側で並列実行する。

## 新規エントリ

`/new` に対応するルートで、`app/new/page.tsx` が担当するページである。豆の新規登録フォームと抽出記録フォームをタブで切り替えられる NewEntryTabs コンポーネントを中心に構成する。

クエリパラメータによって初期表示を制御できる仕様になっている。

| クエリパラメータ | 型 | 説明 |
| :-- | :-- | :-- |
| type | `bean` または `brew` | 表示するタブを指定（省略時は bean） |
| bean | string | 抽出フォームに事前選択する豆 ID |
| copyBean | string | コピー元の豆 ID（初期値としてフォームに展開） |
| copyBrew | string | コピー元の抽出 ID（初期値としてフォームに展開） |

データ取得は `beansService.getBeans()`・`flavorsService.getFlavors()` を常に取得し、`copyBean` / `copyBrew` が指定された場合はそれぞれの詳細データも取得してフォームの初期値に使用する。遷移先は保存成功後の `/beans/{id}` または `/brews/{id}`、ヘッダーの戻るボタン（`/`）である。

## 豆詳細

`/beans/{id}` に対応するルートで、`app/beans/[id]/page.tsx` が担当する豆詳細ページである。ID で豆が特定できない場合は `notFound()` を呼び出して 404 ページを返す。

主要 UI 要素は以下のとおりである。

- Bean Hero セクション（国旗絵文字・豆名・ロースター・RoastLevel コンポーネント）
- Origin セクション（地域・産地国・農園・品種・精製処理）
- Notes セクション（メモがある場合のみ表示）
- Brew History セクション（紐づく抽出を BrewCard で一覧表示、抽出が 0 件の場合は非表示）

ヘッダーには 4 つのアクションボタンが並ぶ。コピー作成（`/new?type=bean&copyBean={id}`）、編集（`/beans/{id}/edit`）、削除（`DELETE /api/beans/{id}` 後 `/` にリダイレクト）、新規抽出（`/new?type=brew&bean={id}`）の順に配置される。データ取得は `beansService.getBeanById(id)` と `brewsService.getBrewsByBeanId(id)` をサーバー側で実行する。

## 豆編集

`/beans/{id}/edit` に対応するルートで、`app/beans/[id]/edit/page.tsx` が担当するページである。ID で豆が見つからない場合は `notFound()` を返す。

既存の豆情報を `beansService.getBeanById(id)` で取得し、`mode="edit"` と `initialBean` プロップを渡した NewBeanForm コンポーネントをメインコンテンツとして表示する。ヘッダーには豆詳細ページ（`/beans/{id}`）への戻るボタンがある。データ取得はサーバー側で実行する。

## 抽出詳細

`/brews/{id}` に対応するルートで、`app/brews/[id]/page.tsx` が担当する抽出詳細ページである。ID で抽出が特定できない場合は `notFound()` を返す。

主要 UI 要素は以下のとおりである。

- Bean Reference カード（豆の国旗・名前・ロースター・総合スコア、クリックで `/beans/{bean.id}` へ遷移するリンク）
- Parameters セクション（豆量・湯量・湯温・挽き目をグリッド表示、Brew Ratio を下部に表示）
- Pour Profile セクション（PourChart コンポーネントによるポアプロファイルグラフ）
- Taste Profile セクション（overall が 0 より大きい場合のみ表示、TasteRadar コンポーネントによるレーダーチャート）
- Flavor Notes セクション（風味タグがある場合のみ表示、タグ名を丸いバッジで一覧表示）
- Tasting Notes セクション（メモがある場合のみ表示）

ヘッダーには 3 つのアクションボタンが並ぶ。コピー作成（`/new?type=brew&copyBrew={id}`）、編集（`/brews/{id}/edit`）、削除（`DELETE /api/brews/{id}` 後 `/beans/{bean.id}` にリダイレクト）の順に配置される。データ取得は `brewsService.getBrewById(id)` をサーバー側で実行し、レスポンスは Bean と Flavor[] を含む `BrewWithBean` 形式である。

## 抽出編集

`/brews/{id}/edit` に対応するルートで、`app/brews/[id]/edit/page.tsx` が担当するページである。ID で抽出が見つからない場合は `notFound()` を返す。

抽出データを `brewsService.getBrewById(id)` で取得し、`beansService.getBeans()` と `flavorsService.getFlavors()` も並列で取得してフォームに渡す。`mode="edit"`・`initialBrew`・`initialBeanId`・`beans`・`flavors` プロップを渡した NewBrewForm コンポーネントをメインコンテンツとして表示する。ヘッダーには抽出詳細ページ（`/brews/{id}`）への戻るボタンがある。

## オフライン

`/offline` に対応するルートで、`app/offline/page.tsx` が担当するページである。Service Worker のフォールバック先として機能し、ネットワーク接続が切断された状態でアプリにアクセスした際に表示される。

表示内容は「You are offline」の見出し、ネットワーク確認を促すメッセージ、ホームに戻るためのリンクボタン（`/`）の 3 要素のみで構成されるシンプルなページである。このページ自体はサーバーサイドデータ取得を持たない。

## グローバル要素

`app/layout.tsx` はすべてのページに共通するルートレイアウトで、以下の要素を全ページに提供する。

フォントは DM Sans（`--font-sans`）と DM Mono（`--font-mono`）を Google Fonts から読み込んでいる。メタデータとして `title: 'Brewia | Coffee Flight Journal'`・`manifest: '/manifest.webmanifest'`・`appleWebApp`（`capable: true`、`title: 'Brewia'`、`statusBarStyle: 'black-translucent'`）が設定されている。ビューポートは `themeColor: '#4a3728'`・`userScalable: false` に設定されている。

共通コンポーネントとして Toaster（`sonner` によるトースト通知）・Analytics（Vercel Analytics）・ServiceWorkerRegistrar（PWA 用 Service Worker の登録）が全ページに埋め込まれる。

## PWA マニフェスト

`app/manifest.ts` は Next.js の `MetadataRoute.Manifest` を使って `/manifest.webmanifest` を配信するファイルである。マニフェストのプロパティは次のとおりで、ブラウザのホーム画面追加機能によるインストールに使用される。

`name` は `'Brewia | Coffee Flight Journal'`、`short_name` は `'Brewia'` に設定されており、インストール後のアプリ名として表示される。`start_url` は `'/'`、`scope` は `'/'`、`display` は `'standalone'`、`orientation` は `'portrait'` に設定されており、ネイティブアプリに近い全画面表示で縦向き固定で動作する。`theme_color` は `'#4a3728'`、`background_color` は `'#ffffff'` である。

アイコンは以下の 4 エントリが定義されている。

| src | sizes | type | purpose |
| :-- | :-- | :-- | :-- |
| /icon-192.png | 192x192 | image/png | any |
| /icon-192.png | 192x192 | image/png | maskable |
| /icon-512.png | 512x512 | image/png | any |
| /icon-512.png | 512x512 | image/png | maskable |
