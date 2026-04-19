import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { ExtractionParseError, LLMApiError } from './errors'
import { getAnthropicModel } from './constants'
import type { LLMClient, RawBeanExtraction } from './types'

const SYSTEM_PROMPT = `あなたはコーヒー豆パッケージの画像を解析し、情報を JSON で抽出する専門家です。
画像から読み取れる情報のみを返してください。
読み取れないフィールドは JSON に含めないでください（null や空文字列は使わないこと）。`

const USER_PROMPT = `以下の画像はコーヒー豆のパッケージです。
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
}`

export class AnthropicLLMClient implements LLMClient {
  private readonly client: Anthropic

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? '') {
    this.client = new Anthropic({ apiKey })
  }

  async extractBeanFromImage(
    imageBase64: string,
    mediaType: 'image/jpeg' | 'image/png'
  ): Promise<RawBeanExtraction> {
    try {
      const message = await this.client.messages.create({
        model: getAnthropicModel(),
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

      const textBlock = message.content.find((b) => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        return {}
      }

      const text = textBlock.text
      try {
        const parsed = JSON.parse(text)
        // MIN-3: null / 配列 / プリミティブは LLM 起因エラーとして 503 を返すべき
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new ExtractionParseError('LLM returned non-object JSON')
        }
        return parsed as RawBeanExtraction
      } catch (parseErr) {
        // ExtractionParseError はそのまま再スロー
        if (parseErr instanceof ExtractionParseError) {
          throw parseErr
        }
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
        throw new ExtractionParseError(msg)
      }
    } catch (err) {
      // ExtractionParseError はそのまま再スロー
      if (err instanceof ExtractionParseError) {
        throw err
      }
      // IMP-4: Anthropic SDK の APIError を instanceof で安全に判定
      if (err instanceof Anthropic.APIError) {
        throw new LLMApiError(err.status ?? 0, err.message)
      }
      // その他の例外も必ず LLMApiError でラップする
      const msg = err instanceof Error ? err.message : 'Unknown LLM error'
      throw new LLMApiError(0, msg)
    }
  }
}
