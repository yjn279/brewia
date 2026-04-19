# 写真から Bean フォームを自動入力する機能 — 詳細アーキテクチャ設計

---

## 1. 機能概要・目的・非対象範囲

### 目的

ユーザーがコーヒー豆のパッケージ写真を撮影または選択すると、Claude Vision API が画像を解析し、Bean 新規作成フォームの各フィールドに値を自動入力する。手入力の手間を削減し、登録精度を高める。

### 対象

- Bean 新規作成フォーム (`components/new-bean-form.tsx`) における自動入力ボタンの追加
- API ルート `POST /api/beans/extract`（画像受理 → 解析 → JSON 返却。DB 書き込みなし）
- LLMClient 抽象化レイヤーと Anthropic 実装

### 非対象範囲

- Brew フォームへの展開
- Bean 編集フォーム（edit モード）への展開（将来拡張として検討可）
- 画像の永続保存・DB への記録
- 信頼度スコアの提示・部分的なフィールドハイライト
- バッチ処理・複数枚画像

---

## 2. ディレクトリ構成提案

### 採用案: `app/beans/extractor/`

**理由:** `extractor` は「Bean リソースに紐づく解析操作」という責務を表す技術的に明確な語で、既存の `service.ts` / `repository.ts` / `schema.ts` のコロケーション規約と整合する。`photo-import` は UI 操作の名前であり Service 層の命名には不適切。

```text
app/
  api/
    beans/
      route.ts                    # 既存: GET / POST
      [id]/route.ts               # 既存
      extract/
        route.ts                  # NEW: POST /api/beans/extract
  beans/
    extractor/
      schema.ts                   # NEW: Zod schema for extract API I/O
      service.ts                  # NEW: ExtractorService（LLM 呼び出し + 正規化）

lib/
  llm/
    types.ts                      # NEW: LLMClient interface, ExtractBeanResult 型
    anthropic-client.ts           # NEW: AnthropicLLMClient implements LLMClient
    constants.ts                  # NEW: モデル名定数

components/
  photo-import-button.tsx         # NEW: カメラ/ギャラリー選択 + 解析中 UI
  new-bean-form.tsx               # MODIFIED: PhotoImportButton を組み込む

.env.example                      # MODIFIED: ANTHROPIC_API_KEY, ANTHROPIC_MODEL を追加
```

---

## 3. 主要 interface・型・Zod schema 定義

### 3.1 `lib/llm/types.ts`

```typescript
/**
 * LLM が返す生の解析結果（サーバー側正規化前）
 * すべてのフィールドは optional — 読み取れなかった項目は undefined
 */
export interface RawBeanExtraction {
  name?: string
  roaster?: string
  country?: string
  region?: string
  farm?: string
  variety?: string
  process?: string
  /** LLM は文字列で返す: "Light" | "Light-Medium" | "Medium" | "Medium-Dark" | "Dark" など */
  roast?: string
  notes?: string
}

/**
 * サービス層での正規化後の結果。
 * 型は Bean フォームの各 state と 1:1 対応する。
 * undefined = 空のまま（フォームへ流し込まない）
 */
export interface ExtractedBeanFields {
  name?: string
  roaster?: string
  /** COUNTRIES に一致した場合のみセット */
  country?: string
  region?: string
  farm?: string
  variety?: string
  /** processes に一致した場合のみセット */
  process?: string
  /** ROAST_LEVELS のインデックス（0-based）で返す */
  roastIndex?: number
  notes?: string
}

/**
 * プロバイダ非依存の LLMClient 契約
 */
export interface LLMClient {
  /**
   * @param imageBase64 - data URI なし。純粋な base64 文字列
   * @param mediaType   - "image/jpeg" | "image/png"
   */
  extractBeanFromImage(
    imageBase64: string,
    mediaType: 'image/jpeg' | 'image/png'
  ): Promise<RawBeanExtraction>
}
```

### 3.2 `lib/llm/constants.ts`

```typescript
/** デフォルトモデル名 */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-latest'

/**
 * Vercel 環境変数で差し替え可能なモデル名を返す関数。
 * 関数化することで vi.stubEnv が機能する（呼び出しごとに評価）。
 */
export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL
}

/** クライアント側の最大ファイルサイズ: 4 MB */
export const CLIENT_MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024

/** サーバー側の最大ファイルサイズ: 4.5 MB（Vercel serverless の body 上限に合わせた値） */
export const SERVER_MAX_IMAGE_SIZE_BYTES = 4.5 * 1024 * 1024

export const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png'] as const
export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]
```

### 3.3 `app/beans/extractor/schema.ts`

> **実装ではこの schema.ts は省略**: Service 層の型安全な `ExtractedBeanFields` で代替している。将来 Route での出力バリデーションが必要になれば追加する。

```typescript
import { z } from 'zod'
import { COUNTRIES, ROAST_LEVELS } from '@/lib/types'

/**
 * POST /api/beans/extract のレスポンス DTO
 * undefined フィールドはレスポンス JSON では省略される（toJSON の挙動に依存）
 * フロント側は受け取ったフィールドのみフォームに流し込む
 */
export const extractedBeanResponseSchema = z.object({
  name: z.string().optional(),
  roaster: z.string().optional(),
  country: z.enum(COUNTRIES).optional(),
  region: z.string().optional(),
  farm: z.string().optional(),
  variety: z.string().optional(),
  process: z.string().optional(),
  /** ROAST_LEVELS のインデックス (0-based) */
  roastIndex: z.number().int().min(0).max(ROAST_LEVELS.length - 1).optional(),
  notes: z.string().optional(),
})

export type ExtractedBeanResponse = z.infer<typeof extractedBeanResponseSchema>

/** Route 層でのエラーレスポンス */
export interface ExtractErrorResponse {
  error: string
  code: 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'EXTRACTION_FAILED' | 'INTERNAL_ERROR'
}
```

### 3.4 Roast マッピング（`app/beans/extractor/service.ts` 内に定義）

```typescript
/**
 * LLM が返す焙煎度文字列 → ROAST_LEVELS インデックスへの正規化マップ
 *
 * ROAST_LEVELS = ['Light','Cinnamon','Medium','High','City','Full City','French','Italian']
 *
 * 要件の「Light=1, Light-Medium=2, Medium=3, Medium-Dark=4, Dark=5」は
 * 5 段階表現であり、既存の 8 段階 ROAST_LEVELS と不整合がある（後述「設計上の未決事項」参照）。
 * 本設計では LLM に 8 段階ラベルで答えさせ、完全一致でインデックスを返す方針を採用する。
 * 一致しない場合は roastIndex を省略する。
 */
const ROAST_STRING_TO_INDEX: Record<string, number> = {
  'light': 0,
  'cinnamon': 1,
  'medium': 2,
  'high': 3,
  'city': 4,
  'full city': 5,
  'french': 6,
  'italian': 7,
}
```

---

## 4. 各層の責務

### 4.1 Route Layer — `app/api/beans/extract/route.ts`

- `multipart/form-data` を `request.formData()` で受け取る
- `file` フィールドの存在・MIME タイプ・サイズを検証し、不正なら `400` を返す
- `ExtractorService.extractFromImage()` を呼び出す
- 成功: `extractedBeanResponseSchema` でバリデーションして `200` JSON を返す
- LLM エラー: `503` を返す
- 予期しない例外: `500` を返す
- DB には一切アクセスしない
- `export const dynamic = 'force-dynamic'` を明示（既存 route と同様）

### 4.2 Service Layer — `app/beans/extractor/service.ts`

- `import 'server-only'` を宣言（既存規約と同様）
- `LLMClient` インスタンスをコンストラクタ注入で受け取る（テスト時にモック差し替え可能）
- `File` を受け取り → `ArrayBuffer` → `Buffer` → `base64` 変換
- `llmClient.extractBeanFromImage()` を呼び出し
- `RawBeanExtraction` を `ExtractedBeanFields` に正規化する
  - `country`: `COUNTRIES` に大文字小文字を無視して一致するものを探す、なければ省略
  - `process`: `processes` 配列に完全一致するものを探す、なければ省略
  - `roast`: `ROAST_STRING_TO_INDEX` でインデックスに変換、一致しなければ省略
  - 文字列フィールド: 前後空白をトリムし、空文字なら省略
- DB には一切アクセスしない

### 4.3 LLMClient Interface — `lib/llm/types.ts`

（前述 3.1 参照）プロバイダへの依存を排除した純粋な契約。将来 Ollama・OpenAI・HuggingFace への差し替えはこの interface の別実装を作るだけでよい。

### 4.4 AnthropicLLMClient — `lib/llm/anthropic-client.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient, RawBeanExtraction } from './types'
import { ANTHROPIC_MODEL } from './constants'

export class AnthropicLLMClient implements LLMClient {
  private readonly client: Anthropic

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? '') {
    this.client = new Anthropic({ apiKey })
  }

  async extractBeanFromImage(
    imageBase64: string,
    mediaType: 'image/jpeg' | 'image/png'
  ): Promise<RawBeanExtraction> {
    const message = await this.client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
    })

    const text = message.content.find((b) => b.type === 'text')?.text ?? '{}'
    // JSON パース失敗は呼び出し元に例外として伝播させる
    return JSON.parse(text) as RawBeanExtraction
  }
}
```

### 4.5 Form Component — `components/photo-import-button.tsx`（新規）

**サブコンポーネントとして切り出す理由:**
- `new-bean-form.tsx` への変更を最小化し、レビュー・テストの対象範囲を局所化できる
- `PhotoImportButton` 単体でテスト可能（fetch モック・FileReader モック）
- 将来的に edit モードや別フォームへの展開が容易

```typescript
'use client'

interface PhotoImportButtonProps {
  /** 解析完了時に呼ばれるコールバック。親フォームがフィールドを更新する */
  onExtracted: (fields: ExtractedBeanFields) => void
}

export function PhotoImportButton({ onExtracted }: PhotoImportButtonProps)
```

- `<input type="file" accept="image/jpeg,image/png">` を hidden で持ち、ボタンクリックで `.click()` を呼ぶ
- ファイル選択後: `FileReader` で base64 変換 → `FormData` に詰めて `POST /api/beans/extract` → 成功時に `onExtracted` を呼ぶ
- 解析中は `Loader2` スピナーをボタン内に表示してボタンを無効化（`isLoading` state）
- エラー時: `sonner` の `toast.error('自動入力に失敗しました。手動で入力してください')` を呼ぶ
- `capture` 属性は付与しない。モバイルでは OS のネイティブ picker で「カメラで撮影 / フォトライブラリ / ファイル」を選択可能。PC ではファイル選択ダイアログが開く

**`new-bean-form.tsx` への変更点（最小限）:**

フォーム先頭に以下を追加するだけ。状態変数の追加は不要（`set*` 関数を `onExtracted` ハンドラに渡す）。

```tsx
// フォーム先頭カード内の h2 の上に挿入
<PhotoImportButton
  onExtracted={(fields) => {
    if (fields.name !== undefined) setName(fields.name)
    if (fields.roaster !== undefined) setRoaster(fields.roaster)
    if (fields.country !== undefined) setCountry(fields.country as Country)
    if (fields.region !== undefined) setRegion(fields.region)
    if (fields.farm !== undefined) setFarm(fields.farm)
    if (fields.variety !== undefined) setVariety(fields.variety)
    if (fields.process !== undefined) setProcess(fields.process)
    if (fields.roastIndex !== undefined) setRoastIndex([fields.roastIndex])
    if (fields.notes !== undefined) setNotes(fields.notes)
  }}
/>
```

**上書き方針の設計判断:**
ユーザーがすでにフォームに入力している状態で「写真から入力」ボタンを押した場合、LLM が読み取れたフィールドは無条件に上書きする。理由: ユーザーは「写真から入力」を明示的に選んだため、意図的な上書き操作と判断する。上書きを避けたければ「写真から入力」ボタン自体を押さなければよい、というシンプルな UX を優先する。

---

## 5. データフロー

### リクエスト〜レスポンス

```
[ユーザー]
  │ 「写真から入力」ボタンをタップ
  ↓
[PhotoImportButton (Client)]
  │ input[type=file] から File を取得
  │ FileReader で base64 変換
  │ FormData に file フィールドとして追加
  │ POST /api/beans/extract (multipart/form-data)
  ↓
[Route: app/api/beans/extract/route.ts (Server)]
  │ formData() でファイル取得
  │ MIME / サイズ バリデーション → 400 on failure
  │ extractorService.extractFromImage(file) を呼び出す
  ↓
[ExtractorService (Server)]
  │ File → ArrayBuffer → base64
  │ llmClient.extractBeanFromImage(base64, mediaType) を呼び出す
  ↓
[AnthropicLLMClient (Server)]
  │ Anthropic Messages API に base64 画像を送信
  │ JSON テキストを受け取る
  │ JSON.parse して RawBeanExtraction を返す
  ↑
[ExtractorService]
  │ RawBeanExtraction を ExtractedBeanFields に正規化（country/process/roast のバリデーション）
  │ ExtractedBeanFields を返す
  ↑
[Route]
  │ extractedBeanResponseSchema で出力バリデーション
  │ 200 JSON { name?, roaster?, country?, ... } を返す
  ↑
[PhotoImportButton (Client)]
  │ response.json() で ExtractedBeanFields 取得
  │ onExtracted(fields) コールバックを呼ぶ
  ↓
[NewBeanForm]
  │ 各フィールドの state を更新（undefined はスキップ）
  ↓
[ユーザー]
  フォームに値が流し込まれた状態を確認、必要に応じて修正して送信
```

---

## 6. プロンプト設計

### System Prompt（役割定義）

```
あなたはコーヒー豆パッケージの画像を解析し、情報を JSON で抽出する専門家です。
画像から読み取れる情報のみを返してください。
読み取れないフィールドは JSON に含めないでください（null や空文字列は使わないこと）。
```

### User Prompt（指示）

```
以下の画像はコーヒー豆のパッケージです。
画像から読み取れる情報を、下記の JSON スキーマに従って返してください。

出力は JSON のみとし、マークダウンや説明文は含めないでください。

{
  "name":    "豆の商品名（例: Yirgacheffe Kochere）",
  "roaster": "焙煎店・ブランド名（例: Onibus Coffee）",
  "country": "生産国。次のいずれかのみ使用: Ethiopia / Kenya / Colombia / Brazil / Guatemala / Panama / Costa Rica / Indonesia / Rwanda / Yemen / Blended",
  "region":  "生産地域（例: Yirgacheffe）",
  "farm":    "農園名・ウォッシングステーション名（例: Kochere Washing Station）",
  "variety": "品種（例: Heirloom, Gesha）",
  "process": "精製方法。次のいずれかのみ使用: Washed / Natural / Honey / Anaerobic / Wet Hulled",
  "roast":   "焙煎度。次のいずれかのみ使用: Light / Cinnamon / Medium / High / City / Full City / French / Italian",
  "notes":   "テイスティングノート・フレーバー情報（例: Jasmine, Blueberry, Citrus）"
}
```

### サニタイズ方針

- LLM レスポンスのテキストブロックから JSON を取り出す際は `JSON.parse()` のみを使用。正規表現による抽出は行わない
- `JSON.parse` が失敗した場合は `ExtractionFailedError` をスローし、上位でキャッチしてクライアントに `503` を返す
- フィールド値は Service 層でトリム・長さ制限（`name`, `roaster` 等は 200 文字超なら切り捨て）を実施する
- 画像データはログに出力しない（後述「8. セキュリティ」参照）

### `max_tokens` の設定根拠

抽出結果の JSON は全フィールド合計でも 512 トークン以内に収まる見込みのため `max_tokens: 512` を設定。プロンプト側で「JSON のみ返す」と明示することでトークン浪費を防ぐ。

---

## 7. エラー設計

### 7.1 エラー型の階層

```typescript
// lib/llm/errors.ts

/** LLM クライアント起因のエラー基底 */
export class LLMError extends Error {}

/** API キー不正・レート超過・Anthropic 側障害 */
export class LLMApiError extends LLMError {
  constructor(public readonly statusCode: number, message: string) {
    super(message)
  }
}

/** LLM レスポンスが JSON パース不能 */
export class ExtractionParseError extends LLMError {}

// app/beans/extractor/errors.ts

/** ファイルサイズ・MIME タイプ違反 */
export class InvalidImageError extends Error {
  constructor(public readonly code: 'INVALID_FILE' | 'FILE_TOO_LARGE') {
    super(code)
  }
}
```

### 7.2 Route でのステータスコードマッピング

| 例外クラス | HTTP ステータス | `code` フィールド |
|---|---|---|
| `InvalidImageError('INVALID_FILE')` | `400` | `INVALID_FILE` |
| `InvalidImageError('FILE_TOO_LARGE')` | `400` | `FILE_TOO_LARGE` |
| `ExtractionParseError` | `503` | `EXTRACTION_FAILED` |
| `LLMApiError` | `503` | `EXTRACTION_FAILED` |
| その他 `Error` | `500` | `INTERNAL_ERROR` |

```typescript
// route.ts のエラーハンドリング骨格
try {
  const fields = await extractorService.extractFromImage(file)
  return NextResponse.json(fields, { status: 200 })
} catch (err) {
  if (err instanceof InvalidImageError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 400 })
  }
  if (err instanceof LLMApiError || err instanceof ExtractionParseError) {
    console.error('[extract] LLM error:', err.message)  // 画像データは含めない
    return NextResponse.json({ error: 'Extraction failed', code: 'EXTRACTION_FAILED' }, { status: 503 })
  }
  console.error('[extract] Unexpected error:', err)
  return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
}
```

### 7.3 フロント側のフォールバック挙動

レスポンス状況に応じて以下のトーストを表示する。フォームは一切変更しない（部分的に入力済みの値も維持される）。`isLoading` を `false` に戻してボタンを再度有効化するのはすべてのケースで共通。

#### 成功系（`response.ok === true`）

| 条件 | トースト種別 | メッセージ |
|---|---|---|
| レスポンスに有効なフィールドが 1 つ以上ある | なし（`onExtracted` を呼ぶ） | — |
| レスポンスが空 `{}` または全フィールド undefined | `toast.warning` | `写真から情報を読み取れませんでした。別の画像か手動入力をお試しください` |

空抽出の場合、`onExtracted` は呼ばない（既存フォーム値を誤って消去しないため）。

#### エラー系（`response.ok === false`）

レスポンス body の `code` フィールドに応じてメッセージを分岐する:

| `code` | HTTP 例 | トーストメッセージ |
|---|---|---|
| `FILE_TOO_LARGE` | 400 | `ファイルサイズが大きすぎます（サーバー側）` |
| `INVALID_FILE` | 400 | `画像形式が不正です（JPEG / PNG のみ対応）` |
| `EXTRACTION_FAILED` | 503 | `AI 解析に失敗しました。しばらく経ってから再度お試しください` |
| その他 / body 読み取り失敗 | 500 など | `自動入力に失敗しました。手動で入力してください` |

#### ネットワークエラー（`fetch` 自体が reject）

`toast.error('自動入力に失敗しました。手動で入力してください')` を表示する。

---

## 8. セキュリティ・運用考慮

### API キー取扱

- `ANTHROPIC_API_KEY` は `.env.local` にのみ設定。`.env.example` にはプレースホルダのみ記載
- `AnthropicLLMClient` は `server-only` モジュールからインポートされる Service からのみ使用。`'use client'` コンポーネントから直接呼ばれることはない
- `lib/llm/anthropic-client.ts` に `import 'server-only'` を宣言し、バンドラレベルでクライアント混入を防ぐ

### 画像サイズ上限

- クライアント側: `PhotoImportButton` でファイル選択後に `file.size > CLIENT_MAX_IMAGE_SIZE_BYTES`（4 MB）を即時チェック。超過時はトーストを出してアップロードをキャンセルする
- サーバー側: Route 層でも `SERVER_MAX_IMAGE_SIZE_BYTES`（4.5 MB）によるサイズチェックを実施（二重防衛）
- Vercel の `bodyParser` デフォルト上限は 4.5 MB のため、クライアント側 4 MB チェックが実質的な第一防衛ラインとなる。Vercel 上限についての補足は項目 9 に記載

### 画像データのログ禁止

- `console.log` / `console.error` のいかなる箇所にも base64 文字列を含めない
- エラーログには `err.message` と HTTP ステータスコードのみを記録する

### レート制御の方針

- 本設計スコープでは Vercel 上のサーバーレスレベルでのレート制限は実装しない
- Anthropic SDK 側でのレート制限エラー（HTTP 429）は `LLMApiError` として捕捉し、`503` を返すことでフロントエンドに伝達する
- 本番リリース後に必要であれば `@upstash/ratelimit` + Vercel KV 等でユーザーセッション単位のレート制限を後付けで実装できる（`extractorService` の呼び出し前に Rate Limiter を挟む設計のため拡張容易）

### multipart フォームの取り扱い

- `request.formData()` でファイルを受け取った後は Anthropic API への送信のみに使用する
- `File` オブジェクトはメモリ上のみで処理し、ディスクへの書き込みやキャッシュは行わない

---

## 9. Vercel デプロイ留意点

### serverless function memory / timeout

- Edge Runtime は Anthropic SDK の Node.js 依存（`fs` モジュール等）と互換性がない場合があるため、`app/api/beans/extract/route.ts` では **Node.js Runtime** を明示する
- デフォルトのメモリは 1024 MB（Hobby プランの場合）。base64 エンコードした 5 MB 画像で約 6.7 MB のメモリを消費するため、余裕がある
- Anthropic API のレスポンスタイムは通常 5〜15 秒程度。Vercel Hobby プランのデフォルトタイムアウト（10 秒）に抵触するリスクがある。Pro プランでは最大 60 秒まで設定可能

```typescript
// app/api/beans/extract/route.ts に追加
export const runtime = 'nodejs'
export const maxDuration = 30  // Pro プラン以上で有効
```

### ペイロード上限

- Vercel のデフォルト request body 上限は **4.5 MB**（serverless functions）
- クライアント側で 5 MB チェックをしているが、base64 エンコードにより実際の転送サイズはファイルサイズの約 1.37 倍になる。**実質的な安全な上限は約 3.2 MB（= 4.5 MB / 1.37）**
- 設計上の対処案: クライアント側の上限を 3 MB に下げるか、`Content-Type: multipart/form-data` で送信し Vercel の multipart ボディサイズ上限（別途 4.5 MB）を利用する（現設計は multipart を採用しているため後者が適用される）
- 詳細は Vercel docs の "Limits" を確認して最終調整すること

### cold start

- `@anthropic-ai/sdk` の初期化コストは軽微（HTTP クライアントの生成のみ）
- `AnthropicLLMClient` のインスタンスは `extractorService` の生成時に 1 度だけ作られる。モジュールレベルのシングルトンとして export することで cold start 後の再実行時のコストを最小化できる（Next.js App Router の serverless 実行モデルでは Warm 状態では再利用される）

---

## 10. TDD スライス分割案

以下の 7 スライスを test-designer に渡す粒度で定義する。各スライスはレッド→グリーン→リファクタで完結できるサイズに調整している。

### Slice 1: LLMClient Interface と型定義（依存なし）

**目的:** `lib/llm/types.ts` と `lib/llm/errors.ts` の型が正しく定義されていることを型レベルで確認する

**テストファイル:** `lib/llm/types.test.ts`

**テスト内容:**
- `RawBeanExtraction` が全フィールド optional であることの型テスト
- `LLMClient` interface に `extractBeanFromImage` メソッドシグネチャが存在することの確認

**依存:** なし

---

### Slice 2: ExtractorService — country/process/roast の正規化ロジック

**目的:** `ExtractorService` がモック `LLMClient` から受け取った `RawBeanExtraction` を正しく `ExtractedBeanFields` に正規化できることを検証する

**テストファイル:** `app/beans/extractor/service.test.ts`

**テスト内容:**
- `country: 'ethiopia'`（小文字）→ `country: 'Ethiopia'` に正規化される
- `country: 'Mexico'`（COUNTRIES 外）→ `country` フィールドが省略される
- `process: 'Washed'`（一致）→ そのまま返る
- `process: 'Wet Process'`（不一致）→ 省略される
- `roast: 'Light'`（一致）→ `roastIndex: 0` が返る
- `roast: 'dark'`（小文字一致）→ `roastIndex: 7` が返る
- `roast: 'unknown'`（不一致）→ `roastIndex` が省略される
- `name: '  Yirgacheffe  '`（前後空白）→ `name: 'Yirgacheffe'` にトリムされる
- LLM がすべてのフィールドを返した場合 → すべて正規化される
- LLM が空 `{}` を返した場合 → `{}` が返る（エラーではない）

**依存:** Slice 1

**モック:** `LLMClient` を `vi.fn()` で実装したスタブを注入する

---

### Slice 3: ExtractorService — エラー伝播

**目的:** LLM 側のエラーが `ExtractorService` から適切にスローされることを検証する

**テストファイル:** `app/beans/extractor/service.test.ts`（Slice 2 と同ファイル）

**テスト内容:**
- `llmClient.extractBeanFromImage` が `LLMApiError` をスローする → `extractorService.extractFromImage` も `LLMApiError` をスローする
- `llmClient.extractBeanFromImage` が `ExtractionParseError` をスローする → 同様に再スロー
- `llmClient.extractBeanFromImage` が不正な JSON 文字列を返す（AnthropicLLMClient での JSON.parse 失敗シナリオのサービス統合）

**依存:** Slice 1, 2

---

### Slice 4: Route Layer — バリデーションとステータスコードマッピング

**目的:** `POST /api/beans/extract` の Route が正しい HTTP ステータスを返すことを検証する

**テストファイル:** `app/api/beans/extract/route.test.ts`

**環境ディレクティブ:** `// @vitest-environment node`

**テスト内容:**
- ファイルなしのリクエスト → `400`
- JPEG/PNG 以外の MIME タイプ → `400`、`code: 'INVALID_FILE'`
- 5 MB 超のファイル → `400`、`code: 'FILE_TOO_LARGE'`
- 正常な JPEG ファイル + ExtractorService が `ExtractedBeanFields` を返す → `200` + フィールド含む JSON
- ExtractorService が `LLMApiError` をスローする → `503`、`code: 'EXTRACTION_FAILED'`
- ExtractorService が予期しない Error をスローする → `500`、`code: 'INTERNAL_ERROR'`

**依存:** Slice 1, 2, 3

**モック:** `ExtractorService` を `vi.mock` でスタブ化する

---

### Slice 5: AnthropicLLMClient — JSON パース正常系

**目的:** `AnthropicLLMClient` が Anthropic SDK のレスポンスから `RawBeanExtraction` を正しくパースできることを検証する

**テストファイル:** `lib/llm/anthropic-client.test.ts`

**環境ディレクティブ:** `// @vitest-environment node`

**テスト内容:**
- Anthropic SDK の `messages.create` をモック → 有効な JSON を含むテキストブロックを返す → `RawBeanExtraction` が正しくパースされる
- テキストブロックが複数ある場合は最初のテキストブロックを使用する
- テキストブロックが存在しない場合は `{}` を返す（空 JSON のフォールバック）
- テキストブロックが不正な JSON を含む場合は `ExtractionParseError` をスローする

**依存:** Slice 1

**モック:** `@anthropic-ai/sdk` の `Anthropic` クラスを `vi.mock` でスタブ化する（実 API は呼ばない）

---

### Slice 6: PhotoImportButton コンポーネント — UI 挙動

**目的:** `PhotoImportButton` が正しい UX フローを提供することを検証する

**テストファイル:** `components/photo-import-button.test.tsx`

**テスト内容:**
- ボタンが「写真から入力」テキストで表示される
- ファイル選択後 `isLoading` 状態になりスピナーが表示される（ボタンが無効化）
- `POST /api/beans/extract` が `200` を返す → `onExtracted` コールバックが抽出フィールドと共に呼ばれる
- `POST /api/beans/extract` が `503` を返す → `toast.error` が呼ばれ `onExtracted` は呼ばれない
- `fetch` が reject する → `toast.error` が呼ばれる
- 解析完了後（成功・失敗問わず）ボタンが再度有効化される（`isLoading: false`）
- クライアント側サイズチェック: 5 MB 超のファイルを選択したとき `toast.error` が呼ばれ fetch は送信されない

**依存:** Slice 4（Route の contract）

**モック:** `vi.stubGlobal('fetch', ...)`, `sonner` の `toast`

---

### Slice 7: NewBeanForm 統合 — `onExtracted` による state 更新

**目的:** `NewBeanForm` が `PhotoImportButton` から渡されたフィールドで各 state を正しく更新することを検証する

**テストファイル:** `components/new-bean-form.test.tsx`

**テスト内容:**
- `PhotoImportButton` の `onExtracted` が呼ばれた後、フォームの name/roaster/country 等が更新される
- `roastIndex` が `2`（=`Medium`）の場合、スライダーの表示ラベルが `Medium` になる
- `country` が `Ethiopia` の場合、Select が `Ethiopia` を選択した状態になる
- LLM が返さなかったフィールド（`undefined`）は既存の入力値を維持する

**依存:** Slice 6

**モック:** `PhotoImportButton` を `vi.mock` で差し替え、`onExtracted` を外部から呼べるようにする（または props 直接テスト）

---

## 11. リスク・トレードオフ・将来拡張の余地

### リスク

| リスク | 影響 | 対処 |
|---|---|---|
| Anthropic API のレスポンスタイムが Vercel Hobby の 10 秒制限を超える | 503 が返りユーザー体験が悪化 | Pro プランへのアップグレード または `maxDuration: 30` 設定（Pro 以上で有効） |
| Claude が JSON 以外のテキストを返す | `JSON.parse` 失敗 → `ExtractionParseError` | プロンプトで「JSON のみ返す」を強調。失敗時はトースト表示でグレースフルデグラデーション |
| 画像が読み取れない（手ブレ・低解像度・非英語パッケージ等）| 抽出フィールドが空 | 設計上許容済み。全フィールドが空の場合もエラーではなく空 JSON `{}` を返し、フォームは変化しない |
| Anthropic 側モデル名の変更 | `ANTHROPIC_MODEL` 環境変数で追従できる | 環境変数を常にデプロイ時に確認するオペレーション体制を整える |

### トレードオフ

- **上書き挙動**: 「読み取れたフィールドは無条件上書き」を採用。ユーザーが入力中のデータが消えるリスクがあるが、確認ダイアログを挟む UX コストと比べてシンプルさを優先した
- **multipart vs JSON**: base64 を JSON ボディで送ると Content-Type が application/json になりシンプルだが、Vercel の 4.5 MB 制限と base64 膨張率の組み合わせで実質 3.2 MB 上限になる。multipart を採用することで Vercel の multipart 上限（同じ 4.5 MB だが base64 膨張がない）を有効活用できる
- **サブコンポーネント切り出し**: `new-bean-form.tsx` を直接変更する案よりファイル数が 1 つ増えるが、テスト独立性と将来拡張性を取った

### 将来拡張の余地

- **edit モード対応**: `PhotoImportButton` の `onExtracted` コールバックは edit モードの `NewBeanForm` にも流用可能
- **別 LLM プロバイダ**: `LLMClient` interface を実装した `OpenAILLMClient` / `OllamaLLMClient` を追加するだけで差し替え可能
- **ユーザー単位のレート制限**: `extractorService.extractFromImage` の呼び出し前に Rate Limiter を挟む設計のため後付け容易
- **抽出精度のモニタリング**: 将来的にフィールド値を匿名化してロギングすれば精度改善のフィードバックループを作れる（現時点では画像データのロギング禁止方針が先行するため実施しない）

---

## 12. 設計上の未決事項・要確認事項

### [重要] Roast レベルの段階数不整合

**問題:** 要件では「Roast 数値化: Light=1, Light-Medium=2, Medium=3, Medium-Dark=4, Dark=5」（5 段階）と指定されているが、既存の `lib/types.ts` の `ROAST_LEVELS` は `['Light', 'Cinnamon', 'Medium', 'High', 'City', 'Full City', 'French', 'Italian']`（8 段階）であり、名称も異なる。

**現設計での決定:** LLM には 8 段階ラベルで答えさせ、`ROAST_LEVELS` のインデックス（0-7）で返す方針を採用した。

**要確認:** 要件の 5 段階マッピング（Light/Light-Medium/Medium/Medium-Dark/Dark）は `ROAST_LEVELS` と整合させる必要がある。以下のいずれかを orchestrator が決定してください:
- (A) 要件の 5 段階を `ROAST_LEVELS` の 8 段階にマッピングするテーブルを作る（例: Light=0, Light-Medium=1, Medium=2, Medium-Dark=5, Dark=7）
- (B) LLM には 8 段階の `ROAST_LEVELS` 文字列で答えさせる（本設計の採用案）
- (C) `ROAST_LEVELS` 自体を 5 段階に変更する（影響範囲が大きいため非推奨）

### [確認] Vercel プランによる `maxDuration` 制限

`export const maxDuration = 30` は Vercel Pro プラン以上でのみ有効。Hobby プランであれば 10 秒制限が残り、Anthropic API の応答が遅い場合にタイムアウトするリスクがある。現在の Vercel プランを確認し、必要に応じてプランのアップグレードか、タイムアウト時のリトライ UI（「もう一度試す」ボタン）の追加を検討してください。

### [確認] `@anthropic-ai/sdk` のバージョン固定

本設計では `@anthropic-ai/sdk` の最新版を使用する想定だが、`package.json` 記載バージョンはメジャーバージョンを固定する（例: `"@anthropic-ai/sdk": "^0.x.0"`）ことを推奨する。SDK のメジャーバージョンアップで型シグネチャが変わる可能性があるため、バージョンポリシーを確認してください。

### [確認] クライアント側の画像上限 UI

クライアント側で「5 MB を超えています」のトーストを出す設計だが、Vercel の multipart 実際の上限（4.5 MB）との差異（本文参照）を踏まえ、クライアント側上限を 3 MB に下げることも選択肢の一つ。ユーザーへの UX（何 MB まで送れるか）を含め最終決定を確認してください。

