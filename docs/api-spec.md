Brewia の API は Next.js App Router の Route Handlers として実装されています。すべての認証必須エンドポイントは HttpOnly Cookie `brewia_session` によるセッション認証を要求します。

## Authentication

認証には `brewia_session` Cookie（HttpOnly, Path=/, SameSite=Lax）を使用します。Cookie がない、または期限切れのセッションの場合は 401 を返します。

## Endpoints

### Auth

`POST /api/auth/signup`

新規ユーザーを作成しセッション Cookie を発行します。認証不要。

リクエスト:

| field    | type   | description          |
| :------- | :----- | :------------------- |
| email    | string | 有効なメールアドレス |
| password | string | 8 文字以上           |

レスポンス:

| status | description              |
| :----- | :----------------------- |
| 201    | 成功。Set-Cookie ヘッダー付き |
| 400    | バリデーションエラー     |
| 409    | メールアドレス重複       |

`POST /api/auth/login`

既存ユーザーでログインしセッション Cookie を発行します。認証不要。

リクエスト:

| field    | type   | description          |
| :------- | :----- | :------------------- |
| email    | string | 登録済みメールアドレス |
| password | string | パスワード           |

レスポンス:

| status | description              |
| :----- | :----------------------- |
| 200    | 成功。Set-Cookie ヘッダー付き |
| 400    | バリデーションエラー     |
| 401    | 認証情報が無効           |

`POST /api/auth/logout`

現在のセッションを削除し Cookie をクリアします。認証必須。

レスポンス: 204（Cookie 削除済み）

`GET /api/auth/me`

現在のセッションユーザー情報を返します。認証必須。

レスポンス:

| status | body                     |
| :----- | :----------------------- |
| 200    | `{ id, email }`          |
| 401    | 未認証                   |

### Beans

`GET /api/beans`

認証ユーザーの豆一覧を返します。認証必須。

レスポンス: `Bean[]`（updated 降順）

`POST /api/beans`

豆を新規登録します。認証必須。

リクエスト (`upsertBeanSchema`):

| field     | type                | required |
| :-------- | :------------------ | :------- |
| name      | string (min 1)      | yes      |
| roaster   | string (min 1)      | yes      |
| country   | Country enum        | yes      |
| roast     | RoastLevel enum     | yes      |
| region    | string              | no       |
| farm      | string              | no       |
| variety   | string              | no       |
| process   | string              | no       |
| priceJpy  | integer \| null     | no       |
| notes     | string              | no       |

レスポンス: `{ id: string }`, 201

`GET /api/beans/[id]`

指定 id の豆を返します。認証必須。自分のデータのみ取得可能。

レスポンス: `Bean` / 404

`PUT /api/beans/[id]`

指定 id の豆を更新します。認証必須。自分のデータのみ更新可能。

リクエスト: POST と同じ `upsertBeanSchema`

レスポンス: `Bean` / 400 / 404

`DELETE /api/beans/[id]`

指定 id の豆と紐づく抽出ログをすべて削除します。認証必須。

レスポンス: 204 / 404

`POST /api/beans/extract`

画像から豆情報を抽出します（Anthropic Claude API 使用）。認証必須。

リクエスト: `multipart/form-data`, `file` フィールドに画像（JPEG/PNG, 最大 4.5MB）

レスポンス:

| status | description                   |
| :----- | :---------------------------- |
| 200    | `ExtractedBeanFields` オブジェクト |
| 400    | ファイルなし・形式不正・サイズ超過 |
| 503    | LLM API エラー               |

### Brews

`GET /api/brews`

認証ユーザーの抽出ログ一覧を返します。`?beanId=` クエリで絞り込み可能。認証必須。

レスポンス: `Brew[]`（created 降順）

`POST /api/brews`

抽出ログを新規登録します。認証必須。

リクエスト (`upsertBrewSchema`):

| field      | type                     | required |
| :--------- | :----------------------- | :------- |
| beanId     | string (uuid)            | yes      |
| beanWeight | number (positive)        | yes      |
| waterWeight | number (positive)       | yes      |
| waterTemp  | number \| empty string   | no       |
| beanGrind  | number \| empty string   | no       |
| steps      | BrewStep[]               | no       |
| aroma      | integer 0-5              | yes      |
| acidity    | integer 0-5              | yes      |
| sweetness  | integer 0-5              | yes      |
| body       | integer 0-5              | yes      |
| overall    | integer 0-5              | yes      |
| notes      | string                   | no       |
| flavorIds  | string[]                 | no       |

レスポンス: `{ id: string }`, 201

`GET /api/brews/[id]`

指定 id の抽出ログ（豆情報・フレーバー込み）を返します。認証必須。

レスポンス: `BrewWithBean` / 404

`PUT /api/brews/[id]`

指定 id の抽出ログを更新します。認証必須。

レスポンス: `BrewWithBean` / 400 / 404

`DELETE /api/brews/[id]`

指定 id の抽出ログを削除します。認証必須。

レスポンス: 204 / 404

### Flavors

`GET /api/flavors`

フレーバーマスター一覧を返します。認証不要。

レスポンス: `Flavor[]`
