import { describe, expect, it } from 'vitest'
import { BREW_PRESETS } from '@/lib/brew-presets'

describe('BREW_PRESETS', () => {
  it('contains between 3 and 5 presets', () => {
    expect(BREW_PRESETS.length).toBeGreaterThanOrEqual(3)
    expect(BREW_PRESETS.length).toBeLessThanOrEqual(5)
  })

  it('includes Hario V60 4:6 preset', () => {
    const preset = BREW_PRESETS.find((p) => p.id === 'hario-v60-46')
    expect(preset).toBeDefined()
    expect(preset?.name).toBe('Hario V60 4:6')
  })

  it('includes Aeropress Standard preset', () => {
    const preset = BREW_PRESETS.find((p) => p.id === 'aeropress-standard')
    expect(preset).toBeDefined()
    expect(preset?.name).toBe('Aeropress Standard')
  })

  it('includes French Press preset', () => {
    const preset = BREW_PRESETS.find((p) => p.id === 'french-press')
    expect(preset).toBeDefined()
    expect(preset?.name).toBe('French Press')
  })

  it('each preset has id, name, description and at least one step', () => {
    for (const preset of BREW_PRESETS) {
      expect(preset.id).toBeTruthy()
      expect(preset.name).toBeTruthy()
      expect(preset.description).toBeTruthy()
      expect(preset.steps.length).toBeGreaterThan(0)
    }
  })

  it('each step has numeric time and water fields', () => {
    for (const preset of BREW_PRESETS) {
      for (const step of preset.steps) {
        expect(typeof step.time).toBe('number')
        expect(typeof step.water).toBe('number')
      }
    }
  })

  it('preset ids are unique', () => {
    const ids = BREW_PRESETS.map((p) => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
