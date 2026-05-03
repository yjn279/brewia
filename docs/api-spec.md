# Brewia API 仕様書

Brewia の API は Next.js App Router の Route Handler で実装されており、すべてのエンドポイントは `/api/` プレフィックスの下に配置されている。リクエストとレスポンスのデータ形式は JSON（`Content-Type: application/json`）を基本とするが、画像アップロードエンドポイントは `multipart/form-data` を受け付ける。入力バリデーションは Zod スキーマ（`upsertBeanSchema` / `upsertBrewSchema`）で行い、検証失敗時は `400` と `{ error: string }` を返す。

## Beans

豆リソースの CRUD を提供するエンドポイント群である。豆の一覧取得・新規作成・個別取得・更新・削除の 5 操作が用意されている。

豆一覧を取得するエンドポイントである（`GET /api/beans`）。登録済みの全豆を `updated` 降順で返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | GET |
| URL | /api/beans |
| リクエストボディ | なし |
| レスポンス | `Bean[]`（JSON 配列） |
| ステータスコード | 200 |

豆を新規登録するエンドポイントである（`POST /api/beans`）。リクエストボディを `upsertBeanSchema` で検証し、合格すれば豆を作成して ID を返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | POST |
| URL | /api/beans |
| リクエストボディ | `upsertBeanSchema`（JSON） |
| レスポンス成功 | `{ id: string }`、ステータス 201 |
| レスポンス失敗 | `{ error: string }`、ステータス 400 |

`upsertBeanSchema` のフィールド定義は以下のとおりである。

| フィールド | 型 | 必須 | 制約・既定値 |
| :-- | :-- | :-- | :-- |
| name | string | 必須 | trim、最小長 1 |
| roaster | string | 必須 | trim、最小長 1 |
| country | string | 必須 | `COUNTRIES` 列挙値のいずれか |
| region | string | 任意 | trim、既定値 `""` |
| farm | string | 任意 | trim、既定値 `""` |
| variety | string | 任意 | trim、既定値 `""` |
| process | string | 任意 | trim、既定値 `""` |
| roast | string | 必須 | `ROAST_LEVELS` 列挙値のいずれか |
| notes | string | 任意 | trim、既定値 `""` |

特定の豆を ID で取得するエンドポイントである（`GET /api/beans/{id}`）。該当する豆が存在しない場合は 404 を返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | GET |
| URL | /api/beans/{id} |
| リクエストボディ | なし |
| レスポンス成功 | `Bean`（JSON オブジェクト）、ステータス 200 |
| レスポンス失敗 | `{ error: "Bean not found" }`、ステータス 404 |

特定の豆を更新するエンドポイントである（`PUT /api/beans/{id}`）。リクエストボディを `upsertBeanSchema` で検証し、合格すれば更新後の豆オブジェクトを返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | PUT |
| URL | /api/beans/{id} |
| リクエストボディ | `upsertBeanSchema`（JSON） |
| レスポンス成功 | `Bean`（JSON オブジェクト）、ステータス 200 |
| レスポンス失敗（検証エラー） | `{ error: string }`、ステータス 400 |
| レスポンス失敗（未発見） | `{ error: "Bean not found" }`、ステータス 404 |

特定の豆を削除するエンドポイントである（`DELETE /api/beans/{id}`）。削除成功時はボディなしの 204 を返す。削除は DB トランザクション内で実行され、紐づく brew_flavor レコードと brew レコードも連鎖削除される。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | DELETE |
| URL | /api/beans/{id} |
| リクエストボディ | なし |
| レスポンス成功 | ボディなし、ステータス 204 |
| レスポンス失敗 | `{ error: "Bean not found" }`、ステータス 404 |

## Beans Extract

豆パッケージ画像から豆情報を自動抽出するエンドポイントである。画像を LLM に送信し、解析結果のフィールド群を JSON で返す。

画像ファイルをアップロードして豆情報を自動抽出するエンドポイントである（`POST /api/beans/extract`）。`multipart/form-data` の `file` フィールドに画像を付けて送信する。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | POST |
| URL | /api/beans/extract |
| リクエスト形式 | `multipart/form-data`、フィールド名 `file` |
| 許可 MIME タイプ | `image/jpeg`、`image/png` |
| 最大ファイルサイズ | 4.5 MB（サーバー側制限） |
| レスポンス成功 | 抽出フィールド群（JSON オブジェクト）、ステータス 200 |

失敗時のレスポンスは以下のエラーコードで識別する。

| ステータス | code | 説明 |
| :-- | :-- | :-- |
| 400 | INVALID_FILE | ファイルなし・非対応 MIME タイプ・不正な form-data |
| 400 | FILE_TOO_LARGE | ファイルサイズが 4.5 MB 超 |
| 503 | EXTRACTION_FAILED | LLM API エラーまたは抽出結果のパース失敗 |
| 500 | INTERNAL_ERROR | 上記以外の予期しないエラー |

## Brews

抽出記録リソースの CRUD を提供するエンドポイント群である。抽出の一覧取得・新規作成・個別取得・更新・削除の 5 操作が用意されている。

抽出一覧を取得するエンドポイントである（`GET /api/brews`）。クエリパラメータ `beanId` が指定された場合はその豆に紐づく抽出のみを返し、省略時は全抽出を返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | GET |
| URL | /api/brews |
| クエリパラメータ | `beanId`（任意、特定の豆に絞り込む） |
| レスポンス | `Brew[]`（JSON 配列）、ステータス 200 |

抽出を新規登録するエンドポイントである（`POST /api/brews`）。リクエストボディを `upsertBrewSchema` で検証し、合格すれば抽出と風味タグを同一トランザクションで作成して ID を返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | POST |
| URL | /api/brews |
| リクエストボディ | `upsertBrewSchema`（JSON） |
| レスポンス成功 | `{ id: string }`、ステータス 201 |
| レスポンス失敗 | `{ error: string }`、ステータス 400 |

`upsertBrewSchema` のフィールド定義は以下のとおりである。

| フィールド | 型 | 必須 | 制約・既定値 |
| :-- | :-- | :-- | :-- |
| beanId | string | 必須 | trim、最小長 1 |
| beanWeight | number | 必須 | 正の数値 |
| beanGrind | number または null | 任意 | 正の数値または空文字（null 変換） |
| waterWeight | number | 必須 | 正の数値 |
| waterTemp | number または null | 任意 | 0–100 の数値または空文字（null 変換） |
| steps | BrewStep[] | 任意 | 既定値 `[]`、各要素は `{ time: number, water: number }`（0 以上） |
| aroma | integer | 必須 | 0–5 の整数 |
| acidity | integer | 必須 | 0–5 の整数 |
| sweetness | integer | 必須 | 0–5 の整数 |
| body | integer | 必須 | 0–5 の整数 |
| overall | integer | 必須 | 0–5 の整数 |
| notes | string | 任意 | trim、既定値 `""` |
| flavorIds | string[] | 任意 | 既定値 `[]`、各要素は trim 済み最小長 1 の文字列 |

特定の抽出を ID で取得するエンドポイントである（`GET /api/brews/{id}`）。レスポンスは Bean 情報と Flavor 配列を含む `BrewWithBean` 形式で返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | GET |
| URL | /api/brews/{id} |
| リクエストボディ | なし |
| レスポンス成功 | `BrewWithBean`（Bean と Flavor[] を含む）、ステータス 200 |
| レスポンス失敗 | `{ error: "Brew not found" }`、ステータス 404 |

特定の抽出を更新するエンドポイントである（`PUT /api/brews/{id}`）。リクエストボディを `upsertBrewSchema` で検証し、合格すれば抽出内容と風味タグを同一トランザクションで更新して更新後オブジェクトを返す。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | PUT |
| URL | /api/brews/{id} |
| リクエストボディ | `upsertBrewSchema`（JSON） |
| レスポンス成功 | `Brew`（JSON オブジェクト）、ステータス 200 |
| レスポンス失敗（検証エラー） | `{ error: string }`、ステータス 400 |
| レスポンス失敗（未発見） | `{ error: "Brew not found" }`、ステータス 404 |

特定の抽出を削除するエンドポイントである（`DELETE /api/brews/{id}`）。削除成功時はボディなしの 204 を返す。削除はトランザクション内で実行され、紐づく brew_flavor レコードも連鎖削除される。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | DELETE |
| URL | /api/brews/{id} |
| リクエストボディ | なし |
| レスポンス成功 | ボディなし、ステータス 204 |
| レスポンス失敗 | `{ error: "Brew not found" }`、ステータス 404 |

## Flavors

風味タグマスターデータを取得するエンドポイントである（`GET /api/flavors`）。登録済みの全風味タグを返す読み取り専用エンドポイントで、書き込み操作は提供していない。

| 項目 | 内容 |
| :-- | :-- |
| メソッド | GET |
| URL | /api/flavors |
| リクエストボディ | なし |
| レスポンス | `Flavor[]`（JSON 配列）、ステータス 200 |
