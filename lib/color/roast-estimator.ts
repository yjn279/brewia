import { ROAST_LEVELS, type RoastLevel } from '@/lib/types'

export const ROAST_L_STAR: Readonly<Record<RoastLevel, number>> = {
  Light: 62,
  Cinnamon: 56,
  Medium: 50,
  High: 44,
  City: 38,
  'Full City': 32,
  French: 26,
  Italian: 20,
}

export function estimateRoastLevel(lStar: number): RoastLevel | null {
  if (lStar < 17 || lStar > 65) return null

  let best: RoastLevel = ROAST_LEVELS[0]
  let bestDiff = Math.abs(lStar - ROAST_L_STAR[best])

  for (let i = 1; i < ROAST_LEVELS.length; i++) {
    const level = ROAST_LEVELS[i]
    const diff = Math.abs(lStar - ROAST_L_STAR[level])
    if (diff < bestDiff) {
      best = level
      bestDiff = diff
    }
  }

  return best
}
