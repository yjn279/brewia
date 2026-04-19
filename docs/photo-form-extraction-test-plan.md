# 写真から Bean フォームを自動入力する機能 — テスト計画

作成日: 2026-04-18  
ブランチ: feat/32-photo-form-extraction  
担当: test-designer

---

## 1. 各 Slice の受け入れ条件一覧表

### Slice 1: LLMClient Interface と型定義

**テストファイル:** `lib/llm/types.test.ts`

| テスト名 | 期待される振る舞い | モック対象 |
|---|---|---|
| RawBeanExtraction — 全フィールド populated | 全 9 フィールドが正しい値で格納される | なし（純型テスト） |
| RawBeanExtraction — 空オブジェクト | 全フィールドが optional = undefined | なし |
| RawBeanExtraction — 部分フィールド | 指定フィールドのみ設定される | なし |
| ExtractedBeanFields — 全フィールド populated | roastIndex/country/process が正しい型 | なし |
| ExtractedBeanFields — 空オブジェクト | 全フィールドが undefined | なし |
| ExtractedBeanFields — roastIndex: 7 | 最大値 7 (Italian) が受け入れられる | なし |
| ExtractedBeanFields — roastIndex: 0 | 最小値 0 (Light) が受け入れられる | なし |
| LLMClient interface — extractBeanFromImage(jpeg) | Promise<RawBeanExtraction> が返る | LLMClient mock |
| LLMClient interface — extractBeanFromImage(png) | image/png が受け入れられる | LLMClient mock |
| LLMError hierarchy — LLMApiError コンストラクタ | statusCode/message が保持される | なし (describe.skip) |
| LLMError hierarchy — ExtractionParseError | LLMError instanceof が true | なし (describe.skip) |
| LLMError hierarchy — LLMError | Error instanceof が true | なし (describe.skip) |

**状態:** types.ts 実装後に 9 tests が green。errors.ts 実装後に describe.skip を外すと 3 tests 追加。

---

### Slice 2 & 3: ExtractorService — 正規化ロジック & エラー伝播

**テストファイル:** `app/beans/extractor/service.test.ts`

| テスト名 | 期待される振る舞い | モック対象 |
|---|---|---|
| country "ethiopia" | "Ethiopia" に正規化 | LLMClient stub |
| country "KENYA" | "Kenya" に正規化 | LLMClient stub |
| country "Mexico" | undefined（省略） | LLMClient stub |
| country "costa rica" | "Costa Rica" に正規化 | LLMClient stub |
| process "Washed" | "Washed" がそのまま通る | LLMClient stub |
| process "Natural" | "Natural" がそのまま通る | LLMClient stub |
| process "Honey" | "Honey" がそのまま通る | LLMClient stub |
| process "Anaerobic" | "Anaerobic" がそのまま通る | LLMClient stub |
| process "Wet Hulled" | "Wet Hulled" がそのまま通る | LLMClient stub |
| process "Wet Process" | undefined（省略） | LLMClient stub |
| process "washed" (小文字) | undefined（大文字小文字区別あり） | LLMClient stub |
| roast "Light" | roastIndex: 0 | LLMClient stub |
| roast "Cinnamon" | roastIndex: 1 | LLMClient stub |
| roast "Medium" | roastIndex: 2 | LLMClient stub |
| roast "High" | roastIndex: 3 | LLMClient stub |
| roast "City" | roastIndex: 4 | LLMClient stub |
| roast "Full City" | roastIndex: 5 | LLMClient stub |
| roast "French" | roastIndex: 6 | LLMClient stub |
| roast "Italian" | roastIndex: 7 | LLMClient stub |
| roast "light" (小文字) | roastIndex: 0（大文字小文字無視） | LLMClient stub |
| roast "full city" (小文字) | roastIndex: 5 | LLMClient stub |
| roast "unknown" | undefined（省略） | LLMClient stub |
| roast "Dark" | undefined（ROAST_LEVELS 外） | LLMClient stub |
| name "  Yirgacheffe  " | "Yirgacheffe" にトリム | LLMClient stub |
| roaster "  Onibus  " | "Onibus" にトリム | LLMClient stub |
| name "   " (空白のみ) | undefined（省略） | LLMClient stub |
| 全フィールド返却 | すべて正規化される | LLMClient stub |
| 空オブジェクト {} 返却 | {} が返る（エラーなし） | LLMClient stub |
| LLMApiError スロー | LLMApiError が再スローされる | LLMClient stub (describe.skip) |
| ExtractionParseError スロー | ExtractionParseError が再スローされる | LLMClient stub (describe.skip) |
| LLMApiError(429) | statusCode: 429 が保持される | LLMClient stub (describe.skip) |

**状態:** service.ts 実装後に Slice 2 の 27 tests が green。errors.ts 実装後に Slice 3 の 3 tests（describe.skip 解除）が追加。

---

### Slice 4: Route Layer — バリデーション & ステータスコード

**テストファイル:** `app/api/beans/extract/route.test.ts`

| テスト名 | 期待される振る舞い | モック対象 |
|---|---|---|
| file フィールドなし | 400, code: INVALID_FILE | extractorService mock |
| MIME = image/gif | 400, code: INVALID_FILE | extractorService mock |
| MIME = application/pdf | 400, code: INVALID_FILE | extractorService mock |
| サイズ 4.5 MB 超 | 400, code: FILE_TOO_LARGE | extractorService mock |
| 正常 JPEG + フィールドあり | 200, フィールドを含む JSON | extractorService mock |
| 正常 PNG | 200, extractorService が呼ばれる | extractorService mock |
| 空オブジェクト返却 | 200, 空 JSON | extractorService mock |
| 予期しない Error | 500, code: INTERNAL_ERROR | extractorService mock |
| LLMApiError (describe.skip) | 503, code: EXTRACTION_FAILED | extractorService mock |
| ExtractionParseError (describe.skip) | 503, code: EXTRACTION_FAILED | extractorService mock |
| runtime エクスポート (describe.skip) | 'nodejs' | なし |
| maxDuration エクスポート (describe.skip) | 30 | なし |

**状態:** route.ts 実装後に 8 tests が green。errors.ts 実装後に describe.skip 解除で 4 tests 追加。

---

### Slice 5: AnthropicLLMClient — JSON パース正常系・異常系

**テストファイル:** `lib/llm/anthropic-client.test.ts`

| テスト名 | 期待される振る舞い | モック対象 |
|---|---|---|
| 有効な JSON テキストブロック | RawBeanExtraction が正しくパース | Anthropic SDK mock |
| 全フィールド JSON | 全フィールドがパースされる | Anthropic SDK mock |
| 空 JSON {} | 空の RawBeanExtraction | Anthropic SDK mock |
| 複数テキストブロック | 最初のブロックを使用 | Anthropic SDK mock |
| テキストブロックなし | {} を返す | Anthropic SDK mock |
| content が空配列 | {} を返す | Anthropic SDK mock |
| 不正 JSON (ExtractionParseError) | ExtractionParseError スロー | Anthropic SDK mock (describe.skip) |
| 空文字列 (ExtractionParseError) | ExtractionParseError スロー | Anthropic SDK mock (describe.skip) |
| max_tokens の検証 | 512 が渡される | Anthropic SDK mock |
| model の検証 | 文字列として渡される | Anthropic SDK mock |
| image source の検証 | base64 data/media_type/type が正しい | Anthropic SDK mock |
| image/png の media_type | image/png が source に含まれる | Anthropic SDK mock |
| ANTHROPIC_MODEL 未設定 | 'claude-haiku-4-5' が使われる | Anthropic SDK mock |
| ANTHROPIC_MODEL 設定あり | 環境変数値がモデル名になる | Anthropic SDK mock |

**状態:** anthropic-client.ts 実装後に 12 tests が green。errors.ts 実装後に describe.skip 解除で 2 tests 追加。

---

### Slice 6: PhotoImportButton — UI 挙動

**テストファイル:** `components/photo-import-button.test.tsx`

| テスト名 | 期待される振る舞い | モック対象 |
|---|---|---|
| 初期描画 — ボタンテキスト | "写真から入力" ボタンが表示される | なし |
| 初期描画 — ボタン有効 | disabled: false | なし |
| 初期描画 — hidden input | accept="image/jpeg,image/png" の input が存在する | なし |
| ファイル選択後 — ローディング | ボタンが disabled、スピナー表示 | fetch (pending) |
| POST 200 — onExtracted 呼び出し | コールバックが抽出フィールドで呼ばれる | fetch mock |
| POST 200 — toast.error なし | エラートーストは呼ばれない | fetch mock |
| 解析完了後 — ボタン再有効化 | disabled: false に戻る | fetch mock |
| POST 503 — toast.error | '自動入力に失敗しました。手動で入力してください' | fetch mock |
| POST 503 — onExtracted 未呼び出し | コールバックは呼ばれない | fetch mock |
| POST 400 — toast.error | toast.error が呼ばれる | fetch mock |
| fetch reject — toast.error | toast.error が呼ばれる | fetch mock (reject) |
| fetch reject — ボタン再有効化 | disabled: false に戻る | fetch mock (reject) |
| 4 MB 超ファイル — toast.error | fetch が送信されない | fetch mock |
| ちょうど 4 MB — fetch 送信 | fetch が 1 回呼ばれる（境界値） | fetch mock |
| リクエスト形式 | /api/beans/extract に POST, body: FormData | fetch mock |

**状態:** photo-import-button.tsx 実装後に describe.skip を外して 15 tests が red → green。

---

### Slice 7: NewBeanForm 統合 — onExtracted による state 更新

**テストファイル:** `components/new-bean-form.test.tsx`

| テスト名 | 期待される振る舞い | モック対象 |
|---|---|---|
| 初期描画 — PhotoImportButton 表示 | data-testid="photo-import-button" が存在する | PhotoImportButton mock |
| onExtracted(name, roaster) | フォームの name/roaster input が更新される | PhotoImportButton mock |
| onExtracted(country: "Ethiopia") | Country select が "Ethiopia" を選択 | PhotoImportButton mock |
| onExtracted(roastIndex: 2) | スライダーの値が 2 になる | PhotoImportButton mock |
| onExtracted(roastIndex: 7) | スライダーの値が 7 になる | PhotoImportButton mock |
| onExtracted(process: "Washed") | Process select が "Washed" を選択 | PhotoImportButton mock |
| onExtracted(notes) | Textarea の値が更新される | PhotoImportButton mock |
| name 手動入力後 → onExtracted(name なし) | name は維持される（undefined はスキップ） | PhotoImportButton mock |
| roastIndex 手動変更後 → onExtracted(roastIndex なし) | スライダー値は維持される | PhotoImportButton mock |
| edit モード + onExtracted | フィールドが上書きされる | PhotoImportButton mock |

**状態:** new-bean-form.tsx に PhotoImportButton を組み込む実装後に 10 tests が green。現時点では 10 tests が fail（正しい red 状態）。

---

## 2. スライス間の依存順序（実装順序）

```
Slice 1 ──────────────────────────────────────────────────┐
  lib/llm/types.ts                                         │
  lib/llm/errors.ts                                        │
  app/beans/extractor/errors.ts                            │
                                                           ▼
Slice 2 & 3 ────────────────────────────────────────────> Slice 4 ──────────> Slice 6 ──> Slice 7
  app/beans/extractor/service.ts                           app/api/beans/      components/  components/
                                                           extract/route.ts    photo-import- new-bean-
Slice 5 ─────────────────────────────────────────────────>                    button.tsx    form.tsx
  lib/llm/anthropic-client.ts                              (ExtractorService
  (ExtractorService 内で使用)                               経由で Anthropic
                                                           を呼ぶため)
```

**推奨実装順序:**

1. `lib/llm/types.ts` — 型定義（インターフェース・型エイリアス）
2. `lib/llm/errors.ts` — エラークラス定義
3. `app/beans/extractor/errors.ts` — InvalidImageError
4. `lib/llm/constants.ts` — ANTHROPIC_MODEL, ALLOWED_MEDIA_TYPES, MAX_IMAGE_SIZE_BYTES
5. `lib/llm/anthropic-client.ts` — AnthropicLLMClient 実装
6. `app/beans/extractor/service.ts` — ExtractorService 実装（LLMClient を DI）
7. `app/api/beans/extract/route.ts` — Route 実装
8. `components/photo-import-button.tsx` — UI コンポーネント
9. `components/new-bean-form.tsx` の修正 — PhotoImportButton を組み込む

---

## 3. カバレッジ範囲と意図的に除外している範囲

### カバレッジ範囲

| カテゴリ | 内容 |
|---|---|
| 型定義の構造 | RawBeanExtraction・ExtractedBeanFields の全フィールドと optional 性 |
| 正規化ロジック全体 | country (11 種)・process (5 種)・roast (8 種) のすべての正規値と境界 |
| トリム処理 | 前後空白・空白のみ文字列の扱い |
| MIME バリデーション | jpeg/png のみ通過、gif/pdf が 400 になること |
| サイズバリデーション | 4.5 MB 超が 400 / 4 MB がクライアント側で拒否される境界値 |
| HTTP ステータスマッピング | 400 (INVALID_FILE・FILE_TOO_LARGE)・200・503 (EXTRACTION_FAILED)・500 (INTERNAL_ERROR) |
| SDK 呼び出し引数 | max_tokens: 512・model 名・image source の base64/media_type/type |
| JSON パース | 正常 JSON・複数ブロック・ブロックなし・不正 JSON・空文字列 |
| UI 状態管理 | ローディング中の disabled・成功後の enabled 復帰 |
| エラー UX | toast.error の文言・fetch reject 時の挙動 |
| state 更新の選択性 | undefined フィールドは既存値を保持する |
| 環境変数上書き | ANTHROPIC_MODEL の差し替え |

### 意図的に除外している範囲

| 除外項目 | 理由 |
|---|---|
| 実 Anthropic API 呼び出し | CI に含めない（後述）。`.env.local` でのローカル E2E として実施 |
| Vercel デプロイ検証 | インフラレベルのテストは CI 範囲外 |
| レート制限の実装テスト | 本機能スコープ外（将来拡張） |
| 画像が読み取れない場合の精度評価 | LLM 出力は非決定的。E2E での目視確認のみ |
| multipart ボディの Vercel 上限（4.5 MB）の実機確認 | ユニットテストで模倣済み。実機は Staging 環境で確認 |
| bean edit モードへの展開 | 将来拡張として設計済み。現スコープ外 |
| capture="environment" の動作 | ブラウザ/デバイス固有挙動。jsdom でテスト不可 |

---

## 4. 実 LLM 呼び出しは CI に含めない

### 方針

すべての CI テスト (`pnpm test`) では Anthropic SDK を `vi.mock` でスタブ化します。実際の API キーを使った呼び出しは一切行いません。理由:

- API キーのコスト・レート制限を CI に持ち込まない
- テスト結果を決定的にする（LLM 出力は非決定的）
- 画像データを CI ログに含めないセキュリティ方針

### ローカル E2E で動作確認する手順（任意）

実際の Claude Vision API を使った動作確認をローカルで行う場合:

```bash
# 1. API キーを設定する（.gitignore されているファイルに）
cp .env.example .env.local
# .env.local に以下を追記:
# ANTHROPIC_API_KEY=sk-ant-xxxx
# ANTHROPIC_MODEL=claude-haiku-4-5  # 省略可（デフォルト値）

# 2. 開発サーバーを起動する
pnpm dev

# 3. http://localhost:3000 にアクセスして
#    「豆を追加」フォームを開く

# 4. 「写真から入力」ボタンをクリックして
#    コーヒー豆パッケージの画像を選択する

# 5. フォームに値が自動入力されることを確認する
```

**注意:**
- `.env.local` は `.gitignore` に含まれており、コミットしないこと
- `ANTHROPIC_API_KEY` を含む `.env.local` は PR には絶対に含めないこと
- ローカル E2E はレビュー前の動作確認目的のみで使用すること

---

## 5. code-writer が green に持っていく際の最小実装ヒント

### Slice 1: lib/llm/types.ts + lib/llm/errors.ts

- `types.ts`: `export interface RawBeanExtraction { name?: string; ... }` と `ExtractedBeanFields`、`LLMClient` をエクスポート
- `errors.ts`: `LLMError extends Error` → `LLMApiError extends LLMError { statusCode: number }` → `ExtractionParseError extends LLMError` の 3 クラスを実装
- `app/beans/extractor/errors.ts`: `InvalidImageError extends Error { code: 'INVALID_FILE' | 'FILE_TOO_LARGE' }` を実装

### Slice 2 & 3: app/beans/extractor/service.ts

- `import 'server-only'` を先頭に宣言する
- `constructor(private readonly llmClient: LLMClient)` でコンストラクタ注入を実装する
- `extractFromImage(file: File)` で `File → ArrayBuffer → Buffer.from().toString('base64')` → `llmClient.extractBeanFromImage()` → `normalize()` の流れを実装する
- `normalize()` 内で COUNTRIES の大文字小文字無視マッチング、processes の完全一致、ROAST_LEVELS の toLowerCase マッチング、文字列トリムを行う

### Slice 4: app/api/beans/extract/route.ts

- ファイルの先頭に `export const runtime = 'nodejs'` と `export const maxDuration = 30` を配置する
- `request.formData()` → `file` フィールド取得 → MIME・サイズ検証 → `extractorService.extractFromImage(file)` → JSON レスポンスの流れを実装する
- catch ブロックで `InvalidImageError` / `LLMApiError` / `ExtractionParseError` / その他の 4 パターンに分岐する

### Slice 5: lib/llm/anthropic-client.ts

- `import 'server-only'` を先頭に宣言する
- `new Anthropic({ apiKey })` でクライアントを初期化し、`ANTHROPIC_MODEL` 定数をモデル名として使う
- `message.content.find((b) => b.type === 'text')?.text ?? '{}'` でテキストブロックを取得し、`JSON.parse()` で `RawBeanExtraction` に変換する
- `JSON.parse` が失敗した場合は `throw new ExtractionParseError(e.message)` を投げる

### Slice 6: components/photo-import-button.tsx

- `'use client'` 宣言、`useState` で `isLoading` を管理する
- `<input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handleFileChange} />` を hidden で配置する
- `handleFileChange` で `file.size > 4 * 1024 * 1024` のチェック → `FormData` に append → `fetch('/api/beans/extract', { method: 'POST', body: formData })` → `response.ok` で `onExtracted(await response.json())` を呼ぶ

### Slice 7: components/new-bean-form.tsx の修正

- `import { PhotoImportButton } from '@/components/photo-import-button'` を追加する
- フォーム内（h2 の直上）に以下を挿入する:

```tsx
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

---

## 6. describe.skip 解除手順（実装完了後）

実装が完了したら、以下の順序で describe.skip を解除する:

1. **Slice 1 の errors テスト:**
   - `lib/llm/types.test.ts` の `describe.skip('LLMError hierarchy...')` → `describe()`
   - 内部のコメントアウトされた import と実装を復元する

2. **Slice 2 & 3:**
   - `app/beans/extractor/service.test.ts` の両 `describe.skip` → `describe()`
   - ファイル先頭の import コメントを解除する

3. **Slice 4:**
   - `app/api/beans/extract/route.test.ts` の全 `describe.skip` → `describe()`
   - import コメントを解除する

4. **Slice 5:**
   - `lib/llm/anthropic-client.test.ts` の `describe.skip` → `describe()`
   - import コメントを解除する

5. **Slice 6:**
   - `components/photo-import-button.test.tsx` の `describe.skip` → `describe()`
   - コメントアウトされた import と実装コードを復元する

6. **Slice 7:**
   - `components/new-bean-form.test.tsx` は skip なし。実装後は自動的に green になる。

---

## 7. テストファイル一覧と総テストケース数

| Slice | テストファイル | テスト数 | 現在の状態 |
|---|---|---|---|
| 1 | `lib/llm/types.test.ts` | 9 tests (+ 3 skip) | 9 tests が types.ts 実装後に green |
| 2 & 3 | `app/beans/extractor/service.test.ts` | 27 tests (+ 3 skip) | 全 skip（service.ts 未実装） |
| 4 | `app/api/beans/extract/route.test.ts` | 8 tests (+ 4 skip) | 全 skip（route.ts 未実装） |
| 5 | `lib/llm/anthropic-client.test.ts` | 12 tests (+ 2 skip) | 全 skip（anthropic-client.ts 未実装） |
| 6 | `components/photo-import-button.test.tsx` | 15 tests | 全 skip（コンポーネント未実装） |
| 7 | `components/new-bean-form.test.tsx` | 10 tests | 10 tests が fail（正しい red 状態） |

**合計:** 81 tests + 12 skip = 93 テストケース

**pnpm test の現在の結果:**
- 10 tests failed (new-bean-form, PhotoImportButton 未統合)
- 66 tests passed (既存テスト)
- 73 tests skipped (新規 describe.skip + 既存 skip)
