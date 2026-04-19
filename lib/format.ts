export function formatJpy(value: number | null | undefined): string | null {
  if (value == null) return null
  // 'en-US' locale is intentional: it renders the JPY symbol as narrow ¥ (U+00A5).
  // Using 'ja-JP' would produce fullwidth ￥ (U+FFE5) instead.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'JPY',
    currencyDisplay: 'symbol',
  }).format(value)
}
