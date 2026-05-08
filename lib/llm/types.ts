import type { RoastLevel } from '@/lib/types'

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
  notes?: string
  /** パッケージに印刷された焙煎度の文字情報（例: "Medium", "中煎り"）。LLM が読み取れない場合は undefined */
  roast?: string
}

/**
 * サービス層での正規化後の結果。
 * 型は Bean フォームの各 state と 1:1 対応する。
 * undefined = 空のまま（フォームへ流し込まない）
 *
 * 注: 焙煎度（roast）はパッケージに印刷された文字情報として LLM が読み取る。
 * PhotoImportButton 経路で LLM が文字情報として返し、ROAST_LEVELS に一致した場合のみセット。
 * 豆の色からの推定は RoastPhotoPicker の責務として別途扱う。
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
  notes?: string
  /** ROAST_LEVELS に一致した場合のみセット */
  roast?: RoastLevel
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
