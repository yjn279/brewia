export function toNullable(value: string | null | undefined): string | null {
  if (value === undefined) {
    throw new Error('undefined is not allowed')
  }

  if (value === null || value.length === 0) {
    return null
  }

  return value
}
