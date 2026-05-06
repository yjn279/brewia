// @vitest-environment node

/**
 * Slice 4: Route Layer — バリデーションとステータスコードマッピング
 *
 * 実装ファイルのパス:
 *   - app/api/beans/extract/route.ts  → @/app/api/beans/extract/route
 *   - app/beans/extractor/service.ts  → @/app/beans/extractor/service
 *   - lib/llm/errors.ts               → @/lib/llm/errors
 *   - app/beans/extractor/errors.ts   → @/app/beans/extractor/errors
 *
 * 確定事項:
 *   - クライアント側上限: 4 MB
 *   - サーバー側上限: 4.5 MB（テストでは 4.5 MB 超のファイルで 400 を確認する）
 *   - 許可 MIME: image/jpeg / image/png のみ
 *   - export const runtime = 'nodejs', maxDuration = 30
 *   - InvalidImageError(INVALID_FILE) → 400, code: 'INVALID_FILE'
 *   - InvalidImageError(FILE_TOO_LARGE) → 400, code: 'FILE_TOO_LARGE'
 *   - LLMApiError / ExtractionParseError → 503, code: 'EXTRACTION_FAILED'
 *   - その他 Error → 500, code: 'INTERNAL_ERROR'
 *
 * red 状態の維持:
 *   - route.ts が存在しない間は全スイートを describe.skip で保護する
 *   - 実装後は describe.skip を describe に変更し、import コメントを解除する
 *
 * code-writer への指示:
 *   1. lib/llm/errors.ts を実装する（LLMError, LLMApiError, ExtractionParseError）
 *   2. app/beans/extractor/errors.ts を実装する（InvalidImageError）
 *   3. app/beans/extractor/service.ts を実装する（extractorService シングルトン含む）
 *   4. app/api/beans/extract/route.ts を実装する
 *      - export const runtime = 'nodejs'
 *      - export const maxDuration = 30
 *      - export async function POST(request: Request): Promise<Response>
 *   5. 上記の describe.skip を describe に変更して pnpm test を実行する
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LLMApiError, ExtractionParseError } from '@/lib/llm/errors'
import { POST } from '@/app/api/beans/extract/route'

// ExtractorService と getAuthenticatedUser をモック化（route.ts が参照するため先にモック）
const { extractFromImageMock, getAuthenticatedUserMock } = vi.hoisted(() => ({
  extractFromImageMock: vi.fn(),
  getAuthenticatedUserMock: vi.fn(),
}))

vi.mock('@/app/beans/extractor/service', () => ({
  extractorService: {
    extractFromImage: extractFromImageMock,
  },
}))

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('server-only', () => ({}))

function makeExtractRequest(file: File | null, url = 'http://localhost/api/beans/extract') {
  const formData = new FormData()
  if (file !== null) formData.append('file', file)
  return new Request(url, { method: 'POST', body: formData })
}

function makeFile(sizeBytes: number, mimeType = 'image/jpeg', name = 'test.jpg') {
  return new File([new Uint8Array(sizeBytes).fill(0xff)], name, { type: mimeType })
}

// ---- Slice 4: 認証テスト ----
describe('POST /api/beans/extract — 認証', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('EXT_AUTH1: 認証なしのとき 401 を返す（ファイルが添付されていても）', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' })
    const response = await POST(makeExtractRequest(file))

    expect(response.status).toBe(401)
    expect(extractFromImageMock).not.toHaveBeenCalled()
  })
})

// ---- Slice 4: バリデーション・正常系テスト ----
describe('POST /api/beans/extract — バリデーション (skip until route.ts is implemented)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 認証済み状態をデフォルトに設定（認証テスト以外では認証済みを前提とする）
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
  })

  // ---- バリデーション: ファイルなし ----

  it('given file フィールドがないリクエストのとき then 400 と code: INVALID_FILE を返す', async () => {
    const request = makeExtractRequest(null)
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('INVALID_FILE')
  })

  // ---- バリデーション: MIME タイプ ----

  it('given MIME タイプが image/gif のファイルのとき then 400 と code: INVALID_FILE を返す', async () => {
    const file = makeFile(1024, 'image/gif', 'test.gif')
    const request = makeExtractRequest(file)
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_FILE')
  })

  it('given MIME タイプが application/pdf のファイルのとき then 400 と code: INVALID_FILE を返す', async () => {
    const file = makeFile(1024, 'application/pdf', 'test.pdf')
    const request = makeExtractRequest(file)
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_FILE')
  })

  // ---- バリデーション: ファイルサイズ ----

  it('given ファイルサイズが 4.5 MB 超のとき then 400 と code: FILE_TOO_LARGE を返す', async () => {
    // 4.5 MB + 1 byte = 4,718,593 bytes
    const file = makeFile(4.5 * 1024 * 1024 + 1, 'image/jpeg')
    const request = makeExtractRequest(file)
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('FILE_TOO_LARGE')
  })

  // ---- 正常系: JPEG ----

  it('given 正常な JPEG ファイルと ExtractorService が ExtractedBeanFields を返すとき then 200 とフィールドを含む JSON を返す', async () => {
    extractFromImageMock.mockResolvedValue({
      name: 'Yirgacheffe Kochere', roaster: 'Onibus', country: 'Ethiopia', roastIndex: 0,
    })
    const request = makeExtractRequest(makeFile(1024, 'image/jpeg'))
    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.name).toBe('Yirgacheffe Kochere')
    expect(body.country).toBe('Ethiopia')
    expect(body.roastIndex).toBe(0)
  })

  // ---- 正常系: PNG ----

  it('given 正常な PNG ファイルのとき then ExtractorService が呼ばれ 200 を返す', async () => {
    extractFromImageMock.mockResolvedValue({ name: 'Brazil Natural' })
    const response = await POST(makeExtractRequest(makeFile(512, 'image/png', 'label.png')))
    expect(response.status).toBe(200)
    expect(extractFromImageMock).toHaveBeenCalledTimes(1)
  })

  // ---- 正常系: 空オブジェクト ----

  it('given LLM が空オブジェクトを返すとき then 200 と空 JSON オブジェクトを返す', async () => {
    extractFromImageMock.mockResolvedValue({})
    const response = await POST(makeExtractRequest(makeFile(1024, 'image/jpeg')))
    expect(response.status).toBe(200)
    expect(typeof await response.json()).toBe('object')
  })

  // ---- エラー系: 予期しない例外 ----

  it('given ExtractorService が予期しない Error をスローするとき then 500 と code: INTERNAL_ERROR を返す', async () => {
    extractFromImageMock.mockRejectedValue(new Error('Unexpected'))
    const response = await POST(makeExtractRequest(makeFile(1024, 'image/jpeg')))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.code).toBe('INTERNAL_ERROR')
    expect(body.details).toBe('Unexpected')
  })
})

// ---- LLM エラー系テスト ----
describe('POST /api/beans/extract — LLM エラー系 (skip until errors.ts files are implemented)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
  })

  it('given ExtractorService が LLMApiError をスローするとき then 503 と code: EXTRACTION_FAILED を返す', async () => {
    extractFromImageMock.mockRejectedValue(new LLMApiError(503, 'Anthropic unavailable'))
    const response = await POST(makeExtractRequest(makeFile(1024, 'image/jpeg')))
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.code).toBe('EXTRACTION_FAILED')
    expect(body.details).toBe('Anthropic unavailable')
  })

  it('given ExtractorService が ExtractionParseError をスローするとき then 503 と code: EXTRACTION_FAILED を返す', async () => {
    extractFromImageMock.mockRejectedValue(new ExtractionParseError('Bad JSON'))
    const response = await POST(makeExtractRequest(makeFile(1024, 'image/jpeg')))
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.code).toBe('EXTRACTION_FAILED')
    expect(body.details).toBe('Bad JSON')
  })

  it('given ExtractorService が非 Error 値をスローするとき then 500 と details に文字列化した値を返す', async () => {
    extractFromImageMock.mockRejectedValue('string error')
    const response = await POST(makeExtractRequest(makeFile(1024, 'image/jpeg')))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.code).toBe('INTERNAL_ERROR')
    expect(body.details).toBe('string error')
  })
})

// ---- Route のエクスポート確認 ----
describe('POST /api/beans/extract — Route エクスポート確認 (skip until route.ts is implemented)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
  })

  it('given route モジュールのとき then runtime が "nodejs" としてエクスポートされている', async () => {
    const routeModule = await import('@/app/api/beans/extract/route')
    expect(routeModule.runtime).toBe('nodejs')
  })

  it('given route モジュールのとき then maxDuration が 30 としてエクスポートされている', async () => {
    const routeModule = await import('@/app/api/beans/extract/route')
    expect(routeModule.maxDuration).toBe(30)
  })
})
