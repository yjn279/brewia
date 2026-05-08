import 'server-only'

import { AnthropicLLMClient } from '@/lib/llm/anthropic-client'
import { ALLOWED_MEDIA_TYPES, SERVER_MAX_IMAGE_SIZE_BYTES } from '@/lib/llm/constants'
import type { ExtractedBeanFields, LLMClient, RawBeanExtraction } from '@/lib/llm/types'
import { COUNTRIES, PROCESSES, ROAST_LEVELS } from '@/lib/types'
import { InvalidImageError } from './errors'

export class ExtractorService {
  constructor(private readonly llmClient: LLMClient) {}

  async extractFromImage(file: File): Promise<ExtractedBeanFields> {
    // MIME チェック
    const mediaType = file.type as (typeof ALLOWED_MEDIA_TYPES)[number]
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      throw new InvalidImageError('INVALID_FILE')
    }

    // サイズチェック（サーバー側: 4.5 MB 超）
    if (file.size > SERVER_MAX_IMAGE_SIZE_BYTES) {
      throw new InvalidImageError('FILE_TOO_LARGE')
    }

    // File → ArrayBuffer → base64 変換
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // LLM 呼び出し（LLMApiError / ExtractionParseError はそのまま再スロー）
    const raw = await this.llmClient.extractBeanFromImage(base64, mediaType)

    return this.normalize(raw)
  }

  private normalize(raw: RawBeanExtraction): ExtractedBeanFields {
    const result: ExtractedBeanFields = {}

    // 文字列フィールドのトリム処理
    const trimOrUndefined = (value?: string): string | undefined => {
      if (value === undefined) return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    }

    // name
    const name = trimOrUndefined(raw.name)
    if (name !== undefined) result.name = name

    // roaster
    const roaster = trimOrUndefined(raw.roaster)
    if (roaster !== undefined) result.roaster = roaster

    // region
    const region = trimOrUndefined(raw.region)
    if (region !== undefined) result.region = region

    // farm
    const farm = trimOrUndefined(raw.farm)
    if (farm !== undefined) result.farm = farm

    // variety
    const variety = trimOrUndefined(raw.variety)
    if (variety !== undefined) result.variety = variety

    // notes
    const notes = trimOrUndefined(raw.notes)
    if (notes !== undefined) result.notes = notes

    // country: COUNTRIES と大文字小文字無視で一致するものに正規化
    if (raw.country !== undefined) {
      const normalizedInput = raw.country.trim().toLowerCase()
      const matched = COUNTRIES.find(
        (c) => c.toLowerCase() === normalizedInput
      )
      if (matched !== undefined) result.country = matched
    }

    // process: PROCESSES に完全一致のみ通す（大文字小文字区別あり）
    if (raw.process !== undefined) {
      const trimmedProcess = raw.process.trim()
      const matched = PROCESSES.find((p) => p === trimmedProcess)
      if (matched !== undefined) result.process = matched
    }

    // roast: ROAST_LEVELS と大文字小文字無視で一致するものに正規化
    if (raw.roast !== undefined) {
      const normalizedInput = raw.roast.trim().toLowerCase()
      const matched = ROAST_LEVELS.find(
        (r) => r.toLowerCase() === normalizedInput
      )
      if (matched !== undefined) result.roast = matched
    }

    return result
  }
}

export const extractorService = new ExtractorService(new AnthropicLLMClient())
