// @vitest-environment node

/**
 * Slice 5: AnthropicLLMClient — JSON パース正常系・異常系
 *
 * 実装ファイルのパス:
 *   - lib/llm/anthropic-client.ts  → @/lib/llm/anthropic-client
 *   - lib/llm/errors.ts            → @/lib/llm/errors
 *
 * Anthropic SDK (@anthropic-ai/sdk) を vi.mock で完全スタブ化し、
 * 実際の API 呼び出しは一切行わない。
 *
 * 確定事項:
 *   - モデルデフォルト: 'claude-haiku-4-5'（process.env.ANTHROPIC_MODEL で上書き可）
 *   - テキストブロックが存在しない場合は空オブジェクト {} を返す
 *   - JSON パース失敗時は ExtractionParseError をスローする
 *   - imageBase64 は data URI なしの純粋な base64 文字列
 *   - max_tokens: 512
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnthropicLLMClient } from '@/lib/llm/anthropic-client'
import { ExtractionParseError, LLMApiError } from '@/lib/llm/errors'

vi.mock('server-only', () => ({}))

// ---- vi.hoisted でモックファクトリを作成 ----
// vi.mock の factory は hoisted されるため、クラス定義も hoisted 内に置く必要がある

const { messagesCreateMock, MockRateLimitError, MockAPIConnectionTimeoutError, MockAuthenticationError, MockAnthropicClass } =
  vi.hoisted(() => {
    const messagesCreateMock = vi.fn()

    /**
     * IMP-4 対応: anthropic-client.ts が `instanceof Anthropic.APIError` で判定するため、
     * モックの MockAnthropic に静的プロパティとして APIError 系クラスを付与する。
     */
    class MockAPIError extends Error {
      status: number
      constructor(status: number, message: string) {
        super(message)
        this.status = status
        this.name = 'APIError'
        Object.setPrototypeOf(this, MockAPIError.prototype)
      }
    }

    class MockRateLimitError extends MockAPIError {
      constructor(message: string) {
        super(429, message)
        this.name = 'RateLimitError'
        Object.setPrototypeOf(this, MockRateLimitError.prototype)
      }
    }

    class MockAPIConnectionTimeoutError extends MockAPIError {
      constructor(message = 'Request timed out.') {
        super(0, message)
        // timeout エラーは status が undefined なので上書き
        ;(this as { status: number | undefined }).status = undefined
        this.name = 'APIConnectionTimeoutError'
        Object.setPrototypeOf(this, MockAPIConnectionTimeoutError.prototype)
      }
    }

    class MockAuthenticationError extends MockAPIError {
      constructor(message: string) {
        super(401, message)
        this.name = 'AuthenticationError'
        Object.setPrototypeOf(this, MockAuthenticationError.prototype)
      }
    }

    class MockAnthropicClass {
      messages = { create: messagesCreateMock }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(..._args: unknown[]) {}

      static APIError = MockAPIError
      static RateLimitError = MockRateLimitError
      static APIConnectionTimeoutError = MockAPIConnectionTimeoutError
      static AuthenticationError = MockAuthenticationError
    }

    return {
      messagesCreateMock,
      MockAPIError,
      MockRateLimitError,
      MockAPIConnectionTimeoutError,
      MockAuthenticationError,
      MockAnthropicClass,
    }
  })

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: MockAnthropicClass,
  }
})

// ---- ヘルパー ----

function makeAnthropicResponse(
  textBlocks: Array<{ type: 'text'; text: string } | { type: 'tool_use' }>
) {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    content: textBlocks,
    model: 'claude-haiku-4-5',
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 50 },
  }
}

const SAMPLE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

// ---- Slice 5: AnthropicLLMClient テスト — 正常系 ----

describe('AnthropicLLMClient.extractBeanFromImage — 正常系', () => {
  let client: AnthropicLLMClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new AnthropicLLMClient('test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ---- 正常系: JSON パース ----

  it('given Anthropic SDK が有効な JSON を含むテキストブロックを返すとき then RawBeanExtraction が正しくパースされる', async () => {
    const expectedJson = {
      name: 'Yirgacheffe Kochere', roaster: 'Onibus Coffee', country: 'Ethiopia', roast: 'Light',
    }
    messagesCreateMock.mockResolvedValue(
      makeAnthropicResponse([{ type: 'text', text: JSON.stringify(expectedJson) }])
    )
    const result = await client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    expect(result.name).toBe('Yirgacheffe Kochere')
    expect(result.roast).toBe('Light')
  })

  it('given Anthropic SDK が全フィールドを含む JSON を返すとき then 全フィールドがパースされる', async () => {
    const fullJson = {
      name: 'Kenya AA', roaster: 'Glitch', country: 'Kenya', region: 'Nyeri',
      farm: 'Kieni', variety: 'SL28', process: 'Washed', roast: 'Light', notes: 'Berry, Citrus',
    }
    messagesCreateMock.mockResolvedValue(
      makeAnthropicResponse([{ type: 'text', text: JSON.stringify(fullJson) }])
    )
    const result = await client.extractBeanFromImage(SAMPLE_BASE64, 'image/png')
    expect(result.name).toBe('Kenya AA')
    expect(result.region).toBe('Nyeri')
  })

  it('given Anthropic SDK が空 JSON オブジェクト {} を返すとき then 空の RawBeanExtraction が返る', async () => {
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([{ type: 'text', text: '{}' }]))
    const result = await client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    expect(result).toEqual({})
  })

  // ---- 正常系: 複数テキストブロック ----

  it('given テキストブロックが複数あるとき then 最初のテキストブロックを使用する', async () => {
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([
      { type: 'text', text: JSON.stringify({ name: 'First Bean' }) },
      { type: 'text', text: JSON.stringify({ name: 'Second Bean' }) },
    ]))
    const result = await client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    expect(result.name).toBe('First Bean')
  })

  // ---- 境界ケース: テキストブロックなし ----

  it('given テキストブロックが存在しないとき then 空オブジェクト {} を返す', async () => {
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([{ type: 'tool_use' }]))
    const result = await client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    expect(result).toEqual({})
  })

  it('given content が空配列のとき then 空オブジェクト {} を返す', async () => {
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([]))
    const result = await client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    expect(result).toEqual({})
  })

  // ---- エラー系: JSON パース失敗 ----

  it('given テキストブロックが不正な JSON を含むとき then ExtractionParseError をスローする', async () => {
    messagesCreateMock.mockResolvedValue(
      makeAnthropicResponse([{ type: 'text', text: 'This is not JSON { invalid' }])
    )
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')).rejects.toThrow(ExtractionParseError)
  })

  it('given テキストブロックが空文字列のとき then ExtractionParseError をスローする', async () => {
    messagesCreateMock.mockResolvedValue(
      makeAnthropicResponse([{ type: 'text', text: '' }])
    )
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')).rejects.toThrow(ExtractionParseError)
  })

  // ---- MIN-3: JSON.parse が null/配列/文字列を返すケース ----

  it('given LLM が "null" を返すとき then ExtractionParseError をスローする', async () => {
    messagesCreateMock.mockResolvedValue(
      makeAnthropicResponse([{ type: 'text', text: 'null' }])
    )
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')).rejects.toThrow(ExtractionParseError)
  })

  it('given LLM が "[]" (配列) を返すとき then ExtractionParseError をスローする', async () => {
    messagesCreateMock.mockResolvedValue(
      makeAnthropicResponse([{ type: 'text', text: '[]' }])
    )
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')).rejects.toThrow(ExtractionParseError)
  })

  it('given LLM が \'"a string"\' (文字列 JSON) を返すとき then ExtractionParseError をスローする', async () => {
    messagesCreateMock.mockResolvedValue(
      makeAnthropicResponse([{ type: 'text', text: '"a string"' }])
    )
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')).rejects.toThrow(ExtractionParseError)
  })

  // ---- SDK 呼び出しの引数検証 ----

  it('given extractBeanFromImage を呼ぶとき then messages.create に max_tokens: 512 が渡される', async () => {
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([{ type: 'text', text: '{}' }]))
    await client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    const callArg = messagesCreateMock.mock.calls[0][0]
    expect(callArg.max_tokens).toBe(512)
  })

  it('given extractBeanFromImage を画像 base64 で呼ぶとき then image source に base64 データが含まれる', async () => {
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([{ type: 'text', text: '{}' }]))
    await client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    const callArg = messagesCreateMock.mock.calls[0][0]
    const imageBlock = callArg.messages[0].content.find((b: { type: string }) => b.type === 'image')
    expect(imageBlock?.source?.data).toBe(SAMPLE_BASE64)
    expect(imageBlock?.source?.media_type).toBe('image/jpeg')
    expect(imageBlock?.source?.type).toBe('base64')
  })

  it('given extractBeanFromImage を image/png で呼ぶとき then source の media_type が image/png になる', async () => {
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([{ type: 'text', text: '{}' }]))
    await client.extractBeanFromImage(SAMPLE_BASE64, 'image/png')
    const callArg = messagesCreateMock.mock.calls[0][0]
    const imageBlock = callArg.messages[0].content.find((b: { type: string }) => b.type === 'image')
    expect(imageBlock?.source?.media_type).toBe('image/png')
  })

  // ---- デフォルトモデル名の確認 (MIN-2: vi.stubEnv で統一) ----

  it('given ANTHROPIC_MODEL 環境変数が未設定のとき then デフォルトモデル "claude-haiku-4-5" が使われる', async () => {
    vi.stubEnv('ANTHROPIC_MODEL', undefined as unknown as string)
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([{ type: 'text', text: '{}' }]))
    const defaultClient = new AnthropicLLMClient('test-api-key')
    await defaultClient.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    const callArg = messagesCreateMock.mock.calls[0][0]
    expect(callArg.model).toBe('claude-haiku-4-5')
  })

  // ---- 環境変数によるモデル名上書き ----

  it('given ANTHROPIC_MODEL 環境変数が設定されているとき then その値がモデル名として使われる', async () => {
    vi.stubEnv('ANTHROPIC_MODEL', 'claude-3-opus-20240229')
    messagesCreateMock.mockResolvedValue(makeAnthropicResponse([{ type: 'text', text: '{}' }]))
    const clientWithEnv = new AnthropicLLMClient('test-api-key')
    await clientWithEnv.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg')
    const callArg = messagesCreateMock.mock.calls[0][0]
    expect(callArg.model).toBe('claude-3-opus-20240229')
  })
})

// ---- IMP-3: SDK エラー → LLMApiError 変換のテスト ----

describe('AnthropicLLMClient.extractBeanFromImage — SDK エラー → LLMApiError 変換 (IMP-3)', () => {
  let client: AnthropicLLMClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new AnthropicLLMClient('test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('given SDK が RateLimitError (429) をスローするとき then LLMApiError(429) でラップされる', async () => {
    messagesCreateMock.mockRejectedValue(new MockRateLimitError('Rate limit exceeded'))
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toBeInstanceOf(LLMApiError)
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toMatchObject({ statusCode: 429 })
  })

  it('given SDK が APIConnectionTimeoutError をスローするとき then LLMApiError でラップされる（statusCode は 0）', async () => {
    messagesCreateMock.mockRejectedValue(new MockAPIConnectionTimeoutError())
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toBeInstanceOf(LLMApiError)
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toMatchObject({ statusCode: 0 })
  })

  it('given SDK が AuthenticationError (401) をスローするとき then LLMApiError(401) でラップされる', async () => {
    messagesCreateMock.mockRejectedValue(new MockAuthenticationError('Invalid API key'))
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toBeInstanceOf(LLMApiError)
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toMatchObject({ statusCode: 401 })
  })

  it('given 想定外の Error がスローされるとき then LLMApiError(0) でラップされる', async () => {
    messagesCreateMock.mockRejectedValue(new Error('Unexpected network failure'))
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toBeInstanceOf(LLMApiError)
    await expect(client.extractBeanFromImage(SAMPLE_BASE64, 'image/jpeg'))
      .rejects.toMatchObject({ statusCode: 0 })
  })
})
