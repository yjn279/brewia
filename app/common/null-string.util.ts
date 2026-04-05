export function toNullableString(value?: string): string | null {
  if (!value) {
    return null
  }

  return value.length > 0 ? value : null
}
