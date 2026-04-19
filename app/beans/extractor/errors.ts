/** ファイルサイズ・MIME タイプ違反 */
export class InvalidImageError extends Error {
  constructor(public readonly code: 'INVALID_FILE' | 'FILE_TOO_LARGE') {
    super(code)
    this.name = 'InvalidImageError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
