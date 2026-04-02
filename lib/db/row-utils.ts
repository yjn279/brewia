import type { BrewStep } from '@/lib/types'

export function parseSteps(value: string): BrewStep[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((step) => typeof step?.time === 'number' && typeof step?.water === 'number')
      .map((step) => ({ time: step.time, water: step.water }))
  } catch {
    return []
  }
}
