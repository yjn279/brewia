/**
 * デフォルトモデル名。
 * Anthropic の `-latest` エイリアスは時期によって無効化される場合があるため、
 * date-stamped 版を採用することで長期的な安定稼働を確保する。
 */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-20241022'

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
