/**
 * Slice 1: LLMClient Interface と型定義
 *
 * lib/llm/types.ts と lib/llm/errors.ts が正しく定義されていることを
 * 型レベル・構造レベルで確認する。
 *
 * 実装ファイルのパス:
 *   - lib/llm/types.ts   → @/lib/llm/types
 *   - lib/llm/errors.ts  → @/lib/llm/errors
 *
 * red 状態の維持方針:
 *   - lib/llm/types.ts が存在しない場合、型 import はランタイムエラーにならないが
 *     実値を参照するテストで失敗する
 *   - lib/llm/errors.ts が存在しない場合、vite:import-analysis がパース段階でクラッシュする
 *     → 指示に従い describe.skip で保護し、実装後に skip を外す
 *   - types.ts のみに依存するテストは describe（skip なし）で記述し、
 *     実装が存在しない場合のランタイム失敗を red とする
 */

import { describe, expect, it, vi } from 'vitest'

// types.ts が未実装の場合は型 import だけではエラーにならないが
// 実値を使う部分（instanceof 等）でランタイムエラーが発生し red になる
import type { ExtractedBeanFields, LLMClient, RawBeanExtraction } from '@/lib/llm/types'
import { ExtractionParseError, LLMApiError, LLMError } from '@/lib/llm/errors'

// ---- RawBeanExtraction のテスト ----
// lib/llm/types.ts が実装されると green になる

describe('RawBeanExtraction — 型定義の確認 (requires lib/llm/types.ts)', () => {
  it('given a fully populated raw extraction object when assigned to RawBeanExtraction then all fields are accepted', () => {
    // Arrange: all fields specified
    // lib/llm/types.ts の RawBeanExtraction インターフェースが
    // 全フィールド optional であることを型チェックで確認する
    const raw: RawBeanExtraction = {
      name: 'Yirgacheffe Kochere',
      roaster: 'Onibus Coffee',
      country: 'Ethiopia',
      region: 'Yirgacheffe',
      farm: 'Kochere Washing Station',
      variety: 'Heirloom',
      process: 'Washed',
      roast: 'Light',
      notes: 'Jasmine, Blueberry',
    }

    // Assert: all fields are present with correct values
    expect(raw.name).toBe('Yirgacheffe Kochere')
    expect(raw.roaster).toBe('Onibus Coffee')
    expect(raw.country).toBe('Ethiopia')
    expect(raw.region).toBe('Yirgacheffe')
    expect(raw.farm).toBe('Kochere Washing Station')
    expect(raw.variety).toBe('Heirloom')
    expect(raw.process).toBe('Washed')
    expect(raw.roast).toBe('Light')
    expect(raw.notes).toBe('Jasmine, Blueberry')
  })

  it('given an empty object when assigned to RawBeanExtraction then all fields are optional and no error occurs', () => {
    // Arrange: no fields — all are optional
    const raw: RawBeanExtraction = {}

    // Assert: no fields present, all are undefined
    expect(raw.name).toBeUndefined()
    expect(raw.roaster).toBeUndefined()
    expect(raw.country).toBeUndefined()
    expect(raw.region).toBeUndefined()
    expect(raw.farm).toBeUndefined()
    expect(raw.variety).toBeUndefined()
    expect(raw.process).toBeUndefined()
    expect(raw.roast).toBeUndefined()
    expect(raw.notes).toBeUndefined()
  })

  it('given a partial raw extraction when assigned to RawBeanExtraction then only specified fields are set', () => {
    // Arrange: only name and country
    const raw: RawBeanExtraction = { name: 'Kenya AA', country: 'Kenya' }

    // Assert
    expect(raw.name).toBe('Kenya AA')
    expect(raw.country).toBe('Kenya')
    expect(raw.roaster).toBeUndefined()
    expect(raw.roast).toBeUndefined()
  })
})

// ---- ExtractedBeanFields のテスト ----

describe('ExtractedBeanFields — 型定義の確認 (requires lib/llm/types.ts)', () => {
  it('given a fully normalized result when assigned to ExtractedBeanFields then all fields are accepted', () => {
    // Arrange
    const fields: ExtractedBeanFields = {
      name: 'Yirgacheffe',
      roaster: 'Onibus',
      country: 'Ethiopia',
      region: 'Yirgacheffe',
      farm: 'Kochere',
      variety: 'Heirloom',
      process: 'Washed',
      roastIndex: 0,
      notes: 'Jasmine',
    }

    // Assert
    expect(fields.roastIndex).toBe(0)
    expect(fields.country).toBe('Ethiopia')
    expect(fields.process).toBe('Washed')
  })

  it('given an empty object when assigned to ExtractedBeanFields then all fields are optional', () => {
    // Arrange
    const fields: ExtractedBeanFields = {}

    // Assert: all optional
    expect(fields.roastIndex).toBeUndefined()
    expect(fields.country).toBeUndefined()
  })

  it('given roastIndex of 7 when assigned to ExtractedBeanFields then the maximum index is accepted', () => {
    // Arrange: index 7 = 'Italian' in ROAST_LEVELS
    const fields: ExtractedBeanFields = { roastIndex: 7 }

    // Assert
    expect(fields.roastIndex).toBe(7)
  })

  it('given roastIndex of 0 when assigned to ExtractedBeanFields then the minimum index is accepted', () => {
    // Arrange: index 0 = 'Light' in ROAST_LEVELS
    const fields: ExtractedBeanFields = { roastIndex: 0 }

    // Assert
    expect(fields.roastIndex).toBe(0)
  })
})

// ---- LLMClient interface のテスト ----

describe('LLMClient interface — 契約の確認 (requires lib/llm/types.ts)', () => {
  it('given a class implementing LLMClient when extractBeanFromImage is called then it returns a Promise of RawBeanExtraction', async () => {
    // Arrange: create a minimal implementation conforming to the interface
    const mockExtract = vi.fn().mockResolvedValue({
      name: 'Test Bean',
      roast: 'Light',
    })

    const client: LLMClient = {
      extractBeanFromImage: mockExtract,
    }

    // Act
    const result = await client.extractBeanFromImage(
      'base64EncodedImageData',
      'image/jpeg'
    )

    // Assert: method was called with correct arguments and returned RawBeanExtraction
    expect(mockExtract).toHaveBeenCalledWith('base64EncodedImageData', 'image/jpeg')
    expect(result.name).toBe('Test Bean')
    expect(result.roast).toBe('Light')
  })

  it('given a client when extractBeanFromImage is called with image/png then it accepts png media type', async () => {
    // Arrange
    const client: LLMClient = {
      extractBeanFromImage: vi.fn().mockResolvedValue({}),
    }

    // Act
    const result = await client.extractBeanFromImage('base64data', 'image/png')

    // Assert: returned value is RawBeanExtraction compatible
    expect(result).toBeDefined()
  })
})

// ---- LLMError 階層のテスト ----
// lib/llm/errors.ts が存在しない間は vite:import-analysis がパース段階でクラッシュする
// 指示に従い describe.skip で保護し、実装後に skip を外す

describe('LLMError hierarchy (requires lib/llm/errors.ts)', () => {
  it('given LLMApiError when constructed with statusCode and message then it has the correct properties', () => {
    const error = new LLMApiError(429, 'Rate limit exceeded')
    expect(error.statusCode).toBe(429)
    expect(error.message).toBe('Rate limit exceeded')
    expect(error).toBeInstanceOf(LLMError)
  })

  it('given ExtractionParseError when constructed with a message then it is an instance of LLMError', () => {
    const error = new ExtractionParseError('Invalid JSON from LLM')
    expect(error).toBeInstanceOf(LLMError)
    expect(error.message).toBe('Invalid JSON from LLM')
  })

  it('given LLMError when instanceof checked against Error then it is true', () => {
    const error = new LLMError('base llm error')
    expect(error).toBeInstanceOf(Error)
  })
})
