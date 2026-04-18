import type { RoastLevel } from '@/lib/types'

export const ROAST_COLORS: Record<RoastLevel, string> = {
  Light: 'oklch(0.82 0.10 72)',
  Cinnamon: 'oklch(0.72 0.12 65)',
  Medium: 'oklch(0.62 0.12 58)',
  High: 'oklch(0.53 0.11 52)',
  City: 'oklch(0.44 0.09 48)',
  'Full City': 'oklch(0.36 0.07 45)',
  French: 'oklch(0.26 0.05 42)',
  Italian: 'oklch(0.18 0.03 40)',
}
