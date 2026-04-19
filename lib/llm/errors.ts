/** LLM クライアント起因のエラー基底 */
export class LLMError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'LLMError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** API キー不正・レート超過・Anthropic 側障害 */
export class LLMApiError extends LLMError {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'LLMApiError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** LLM レスポンスが JSON パース不能 */
export class ExtractionParseError extends LLMError {
  constructor(message?: string) {
    super(message)
    this.name = 'ExtractionParseError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
