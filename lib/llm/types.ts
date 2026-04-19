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
  /** LLM は文字列で返す: "Light" | "Cinnamon" | "Medium" | "High" | "City" | "Full City" | "French" | "Italian" など */
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
  /** PROCESSES に一致した場合のみセット */
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
