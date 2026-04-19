/**
 * デフォルトモデル名: Claude 4.5 Haiku の API エイリアス。
 * date-stamped 版が必要なら `claude-haiku-4-5-20251001` を `ANTHROPIC_MODEL` 環境変数で指定。
 */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5'

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
