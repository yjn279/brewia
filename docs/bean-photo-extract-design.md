# Bean 写真フィールド自動抽出 — 詳細設計

## 1. 機能概要

ユーザーがコーヒー豆のパッケージ写真を選択すると、Claude Vision API が画像を解析し、Bean 新規作成フォームの各フィールドに値を自動入力する。手入力の手間を削減し、登録精度を高める。

### 対象範囲

- Bean 新規作成フォーム（`components/new-bean-form.tsx`）における自動入力ボタン
- API ルート `POST /api/beans/extract`（画像受理 → 解析 → JSON 返却。DB 書き込みなし）
- LLMClient 抽象化レイヤーと Anthropic 実装

### スコープ外

- Brew フォームへの展開
- Bean 編集フォーム（edit モード）への展開
- 画像の永続保存
- 信頼度スコアの提示・フィールドハイライト
- バッチ処理・複数枚画像

## 2. ディレクトリ構成

`extractor` は「Bean リソースに紐づく解析操作」を表す語で、既存の `service.ts` / `repository.ts` / `schema.ts` のコロケーション規約と整合する。

```text
app/
  api/
    beans/
      extract/
        route.ts          # POST /api/beans/extract
  beans/
    extractor/
      service.ts          # ExtractorService（LLM 呼び出し + 正規化）

lib/
  llm/
    types.ts              # LLMClient interface, ExtractBeanResult 型
    anthropic-client.ts   # AnthropicLLMClient implements LLMClient
    constants.ts          # モデル名定数

components/
  photo-import-button.tsx # カメラ/ギャラリー選択 + 解析中 UI
```

## 3. 主要な型定義

### `lib/llm/types.ts`

```typescript
/** LLM が返す生の解析結果。読み取れなかったフィールドは undefined */
export interface RawBeanExtraction {
  name?: string; roaster?: string; country?: string; region?: string
  farm?: string; variety?: string; process?: string; notes?: string
}

/** サービス層での正規化後の結果。undefined フィールドはフォームへ流し込まない */
export interface ExtractedBeanFields {
  name?: string; roaster?: string; country?: string; region?: string
  farm?: string; variety?: string; process?: string; notes?: string
}

/** プロバイダ非依存の LLMClient 契約 */
export interface LLMClient {
  extractBeanFromImage(
    imageBase64: string,
    mediaType: 'image/jpeg' | 'image/png'
  ): Promise<RawBeanExtraction>
}
```

焙煎度（roast）の自動入力は本機能のスコープ外。画像の色から CIELAB L* を用いた推定機能が別途実装されているため、責務が重複しないよう除外している。

## 4. 各層の責務

### Route Layer — `app/api/beans/extract/route.ts`

`multipart/form-data` を受け取り、ファイルの存在・MIME タイプ・サイズを検証する。`ExtractorService.extractFromImage()` を呼び出して成功時は `200 JSON` を返す。LLM エラーは `503`、予期しない例外は `500`。DB には一切アクセスしない。

### Service Layer — `app/beans/extractor/service.ts`

`File` を `base64` に変換して `LLMClient` を呼び出す。`RawBeanExtraction` を `ExtractedBeanFields` に正規化する（`country` は `COUNTRIES` と大文字小文字無視で照合、`process` は完全一致、文字列は trim して空なら省略）。DB には一切アクセスしない。

### AnthropicLLMClient — `lib/llm/anthropic-client.ts`

Anthropic Messages API に base64 画像を送信し、JSON テキストを `RawBeanExtraction` としてパースして返す。レスポンスがマークダウンコードブロックでラップされている場合は `stripJsonFence()` で前処理する。パース失敗時は `ExtractionParseError` をスローする。

### PhotoImportButton — `components/photo-import-button.tsx`

```typescript
'use client'
interface PhotoImportButtonProps {
  onExtracted: (fields: ExtractedBeanFields) => void
}
export function PhotoImportButton({ onExtracted }: PhotoImportButtonProps)
```

ファイル選択後、`FormData` に詰めて `POST /api/beans/extract` を呼ぶ。解析中はスピナーを表示してボタンを無効化する。エラー時は `sonner` の `toast.error` を呼ぶ。LLM が読み取れたフィールドは既存の入力値を無条件に上書きする（ユーザーが明示的に「写真から入力」を選んだため）。

## 5. データフロー

```
ユーザー → 「写真から入力」ボタンタップ
PhotoImportButton → input[type=file] から File を取得 → FormData に追加
→ POST /api/beans/extract (multipart/form-data)
Route → MIME / サイズ検証 → ExtractorService.extractFromImage(file)
ExtractorService → File → base64 → LLMClient.extractBeanFromImage()
AnthropicLLMClient → Anthropic API → JSON パース → RawBeanExtraction を返す
ExtractorService → 正規化 → ExtractedBeanFields を返す
Route → 200 JSON { name?, roaster?, country?, ... }
PhotoImportButton → onExtracted(fields) コールバック
NewBeanForm → 各フィールドの state を更新（undefined はスキップ）
```

## 6. プロンプト設計

デフォルトモデルは `claude-haiku-4-5`（`ANTHROPIC_MODEL` 環境変数で上書き可）。`max_tokens: 512` を設定しており、JSON 全フィールドで収まる見込み。

LLM には「画像から読み取れる情報のみを JSON で返す。読み取れないフィールドは含めない」という指示を与える。レスポンスは `country` / `process` / `roast` を既知の定数リストと照合して正規化する。

## 7. エラー設計

| 例外クラス | HTTP | `code` フィールド |
|---|---|---|
| `InvalidImageError('INVALID_FILE')` | 400 | `INVALID_FILE` |
| `InvalidImageError('FILE_TOO_LARGE')` | 400 | `FILE_TOO_LARGE` |
| `ExtractionParseError` | 503 | `EXTRACTION_FAILED` |
| `LLMApiError` | 503 | `EXTRACTION_FAILED` |
| その他 `Error` | 500 | `INTERNAL_ERROR` |

クライアント側ではレスポンスの `code` フィールドに応じてトーストメッセージを決定する。`response.ok === true` でも全フィールドが空の場合は `toast.warning` を表示し、`onExtracted` は呼ばない。

## 8. セキュリティ・運用考慮

- `ANTHROPIC_API_KEY` は `.env.local` にのみ設定する
- `lib/llm/anthropic-client.ts` に `import 'server-only'` を宣言し、クライアントバンドルへの混入を防ぐ
- クライアント側 4 MB、サーバー側 4.5 MB（Vercel serverless 上限に合わせた値）でサイズチェックを二重に行う
- エラーログには `err.message` のみ記録し、base64 文字列は含めない

## 9. Vercel デプロイ留意点

`app/api/beans/extract/route.ts` では Node.js Runtime を明示する（Edge Runtime は Anthropic SDK の Node.js 依存と非互換な場合があるため）。

```typescript
export const runtime = 'nodejs'
export const maxDuration = 30  // Pro プラン以上で有効
```

Vercel のデフォルト request body 上限は 4.5 MB。`multipart/form-data` で送信することでこの上限を有効活用している。
