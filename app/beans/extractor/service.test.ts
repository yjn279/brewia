/**
 * Slice 2: ExtractorService — country / process / roast 正規化ロジック
 * Slice 3: ExtractorService — エラー伝播
 *
 * 実装ファイルのパス:
 *   - app/beans/extractor/service.ts  → @/app/beans/extractor/service
 *   - lib/llm/types.ts                → @/lib/llm/types
 *   - lib/llm/errors.ts               → @/lib/llm/errors
 *
 * テスト戦略:
 *   - LLMClient は vi.fn() で実装したスタブをコンストラクタに注入する
 *   - 実際の LLM / Anthropic API は一切呼ばない
 *   - 'server-only' モジュールは vi.mock でスタブ化する
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LLMClient, RawBeanExtraction } from '@/lib/llm/types'
import { ExtractionParseError, LLMApiError } from '@/lib/llm/errors'
import { ExtractorService } from '@/app/beans/extractor/service'

// server-only はテスト環境では空にする
vi.mock('server-only', () => ({}))
// AnthropicLLMClient の初期化（browser-like 環境エラー）を防ぐ
vi.mock('@/lib/llm/anthropic-client', () => ({
  AnthropicLLMClient: class MockAnthropicLLMClient {
    extractBeanFromImage = vi.fn()
  },
}))

function makeMockClient(returnValue: RawBeanExtraction): LLMClient {
  return { extractBeanFromImage: vi.fn().mockResolvedValue(returnValue) }
}

function makeJpegFile(name = 'test.jpg'): File {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9])
  return new File([bytes], name, { type: 'image/jpeg' })
}

// ---- Slice 2: 正規化ロジック ----

describe('ExtractorService.extractFromImage — 正規化ロジック (skip until service.ts is implemented)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('country の正規化', () => {
    it('given country が小文字 "ethiopia" のとき then "Ethiopia" に正規化される', async () => {
      const client = makeMockClient({ country: 'ethiopia' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.country).toBe('Ethiopia')
    })

    it('given country が大文字混在 "KENYA" のとき then "Kenya" に正規化される', async () => {
      const client = makeMockClient({ country: 'KENYA' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.country).toBe('Kenya')
    })

    it('given country が COUNTRIES 外の "Mexico" のとき then country フィールドは省略される', async () => {
      const client = makeMockClient({ country: 'Mexico' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.country).toBeUndefined()
    })

    it('given country が "costa rica"（スペース含む・小文字）のとき then "Costa Rica" に正規化される', async () => {
      const client = makeMockClient({ country: 'costa rica' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.country).toBe('Costa Rica')
    })
  })

  describe('process の正規化', () => {
    it('given process が "Washed"（完全一致）のとき then そのまま "Washed" が返る', async () => {
      const client = makeMockClient({ process: 'Washed' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.process).toBe('Washed')
    })

    it('given process が "Natural" のとき then そのまま "Natural" が返る', async () => {
      const client = makeMockClient({ process: 'Natural' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.process).toBe('Natural')
    })

    it('given process が "Honey" のとき then そのまま "Honey" が返る', async () => {
      const client = makeMockClient({ process: 'Honey' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.process).toBe('Honey')
    })

    it('given process が "Anaerobic" のとき then そのまま "Anaerobic" が返る', async () => {
      const client = makeMockClient({ process: 'Anaerobic' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.process).toBe('Anaerobic')
    })

    it('given process が "Wet Hulled" のとき then そのまま "Wet Hulled" が返る', async () => {
      const client = makeMockClient({ process: 'Wet Hulled' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.process).toBe('Wet Hulled')
    })

    it('given process が不一致の "Wet Process" のとき then process フィールドは省略される', async () => {
      const client = makeMockClient({ process: 'Wet Process' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.process).toBeUndefined()
    })

    it('given process が小文字 "washed" のとき then process フィールドは省略される（大文字小文字は区別する）', async () => {
      const client = makeMockClient({ process: 'washed' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.process).toBeUndefined()
    })
  })

  describe('roast の正規化', () => {
    // ROAST_LEVELS = ['Light','Cinnamon','Medium','High','City','Full City','French','Italian']
    //  index:               0          1         2        3       4         5          6         7

    it('given roast が "Light" のとき then roastIndex: 0 が返る', async () => {
      const client = makeMockClient({ roast: 'Light' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(0)
    })

    it('given roast が "Cinnamon" のとき then roastIndex: 1 が返る', async () => {
      const client = makeMockClient({ roast: 'Cinnamon' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(1)
    })

    it('given roast が "Medium" のとき then roastIndex: 2 が返る', async () => {
      const client = makeMockClient({ roast: 'Medium' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(2)
    })

    it('given roast が "High" のとき then roastIndex: 3 が返る', async () => {
      const client = makeMockClient({ roast: 'High' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(3)
    })

    it('given roast が "City" のとき then roastIndex: 4 が返る', async () => {
      const client = makeMockClient({ roast: 'City' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(4)
    })

    it('given roast が "Full City" のとき then roastIndex: 5 が返る', async () => {
      const client = makeMockClient({ roast: 'Full City' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(5)
    })

    it('given roast が "French" のとき then roastIndex: 6 が返る', async () => {
      const client = makeMockClient({ roast: 'French' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(6)
    })

    it('given roast が "Italian" のとき then roastIndex: 7 が返る', async () => {
      const client = makeMockClient({ roast: 'Italian' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(7)
    })

    it('given roast が小文字 "light" のとき then roastIndex: 0 が返る（大文字小文字無視）', async () => {
      const client = makeMockClient({ roast: 'light' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(0)
    })

    it('given roast が小文字 "full city" のとき then roastIndex: 5 が返る', async () => {
      const client = makeMockClient({ roast: 'full city' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBe(5)
    })

    it('given roast が不一致の "unknown" のとき then roastIndex フィールドは省略される', async () => {
      const client = makeMockClient({ roast: 'unknown' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBeUndefined()
    })

    it('given roast が "Dark"（ROAST_LEVELS 外）のとき then roastIndex フィールドは省略される', async () => {
      const client = makeMockClient({ roast: 'Dark' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roastIndex).toBeUndefined()
    })
  })

  describe('文字列フィールドのトリム', () => {
    it('given name に前後空白 "  Yirgacheffe  " があるとき then "Yirgacheffe" にトリムされる', async () => {
      const client = makeMockClient({ name: '  Yirgacheffe  ' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.name).toBe('Yirgacheffe')
    })

    it('given roaster に前後空白があるとき then トリムされた値が返る', async () => {
      const client = makeMockClient({ roaster: '  Onibus Coffee  ' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.roaster).toBe('Onibus Coffee')
    })

    it('given name がトリム後に空文字になるとき then name フィールドは省略される', async () => {
      const client = makeMockClient({ name: '   ' })
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.name).toBeUndefined()
    })
  })

  describe('全フィールド・空フィールドの境界ケース', () => {
    it('given LLM が全フィールドを返したとき then すべて正規化される', async () => {
      const raw = {
        name: 'Kenya AA', roaster: 'Glitch', country: 'kenya', region: 'Nyeri',
        farm: 'Kieni', variety: 'SL28', process: 'Washed', roast: 'Light', notes: 'Berry, Citrus',
      }
      const client = makeMockClient(raw)
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result.name).toBe('Kenya AA')
      expect(result.country).toBe('Kenya')
      expect(result.process).toBe('Washed')
      expect(result.roastIndex).toBe(0)
    })

    it('given LLM が空オブジェクト {} を返したとき then {} が返る（エラーではない）', async () => {
      const client = makeMockClient({})
      const service = new ExtractorService(client)
      const result = await service.extractFromImage(makeJpegFile())
      expect(result).toBeDefined()
      expect(result.name).toBeUndefined()
      expect(result.country).toBeUndefined()
      expect(result.roastIndex).toBeUndefined()
    })
  })
})

// ---- Slice 3: エラー伝播 ----

describe('ExtractorService.extractFromImage — エラー伝播 (skip until errors.ts files are implemented)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('given llmClient が LLMApiError をスローするとき then ExtractorService も LLMApiError をスローする', async () => {
    const apiError = new LLMApiError(503, 'Service Unavailable')
    const client: LLMClient = { extractBeanFromImage: vi.fn().mockRejectedValue(apiError) }
    const service = new ExtractorService(client)
    await expect(service.extractFromImage(makeJpegFile())).rejects.toThrow(LLMApiError)
    await expect(service.extractFromImage(makeJpegFile())).rejects.toThrow('Service Unavailable')
  })

  it('given llmClient が ExtractionParseError をスローするとき then ExtractorService も ExtractionParseError をスローする', async () => {
    const parseError = new ExtractionParseError('Invalid JSON response')
    const client: LLMClient = { extractBeanFromImage: vi.fn().mockRejectedValue(parseError) }
    const service = new ExtractorService(client)
    await expect(service.extractFromImage(makeJpegFile())).rejects.toThrow(ExtractionParseError)
  })

  it('given llmClient がレート制限エラー LLMApiError(429) をスローするとき then statusCode が保持される', async () => {
    const rateError = new LLMApiError(429, 'Rate limit exceeded')
    const client: LLMClient = { extractBeanFromImage: vi.fn().mockRejectedValue(rateError) }
    const service = new ExtractorService(client)
    await expect(service.extractFromImage(makeJpegFile())).rejects.toMatchObject({ statusCode: 429 })
  })
})
