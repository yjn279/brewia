import { describe, expect, it } from 'vitest'
import { BREW_PRESETS } from '@/lib/brew-presets'

describe('BREW_PRESETS', () => {
  it('has between 3 and 5 presets', () => {
    expect(BREW_PRESETS.length).toBeGreaterThanOrEqual(3)
    expect(BREW_PRESETS.length).toBeLessThanOrEqual(5)
  })

  it('all ids are unique and non-empty', () => {
    const ids = BREW_PRESETS.map((p) => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0)
    }
  })

  it('contains V60, Aeropress, and French Press presets', () => {
    const ids = BREW_PRESETS.map((p) => p.id)
    expect(ids).toContain('v60-4-6')
    expect(ids).toContain('aeropress-standard')
    expect(ids).toContain('french-press')
  })

  it('each preset has non-empty name and description', () => {
    for (const preset of BREW_PRESETS) {
      expect(preset.name.length, `preset ${preset.id} name`).toBeGreaterThan(0)
      expect(preset.description.length, `preset ${preset.id} description`).toBeGreaterThan(0)
    }
  })

  it('each preset has at least one step', () => {
    for (const preset of BREW_PRESETS) {
      expect(preset.steps.length, `preset ${preset.id} steps`).toBeGreaterThanOrEqual(1)
    }
  })

  it('all step time and water values are finite non-negative integers', () => {
    for (const preset of BREW_PRESETS) {
      for (const step of preset.steps) {
        expect(Number.isFinite(step.time), `preset ${preset.id} step.time ${step.time}`).toBe(true)
        expect(Number.isFinite(step.water), `preset ${preset.id} step.water ${step.water}`).toBe(true)
        expect(step.time, `preset ${preset.id} step.time >= 0`).toBeGreaterThanOrEqual(0)
        expect(step.water, `preset ${preset.id} step.water >= 0`).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(step.time), `preset ${preset.id} step.time is integer`).toBe(true)
        expect(Number.isInteger(step.water), `preset ${preset.id} step.water is integer`).toBe(true)
      }
    }
  })

  it('step time values are strictly monotonically increasing', () => {
    for (const preset of BREW_PRESETS) {
      const times = preset.steps.map((s) => s.time)
      for (let i = 1; i < times.length; i++) {
        expect(
          times[i],
          `preset ${preset.id} step[${i}].time > step[${i - 1}].time`,
        ).toBeGreaterThan(times[i - 1]!)
      }
    }
  })

  it('step water values are monotonically non-decreasing', () => {
    for (const preset of BREW_PRESETS) {
      const waters = preset.steps.map((s) => s.water)
      for (let i = 1; i < waters.length; i++) {
        expect(
          waters[i],
          `preset ${preset.id} step[${i}].water >= step[${i - 1}].water`,
        ).toBeGreaterThanOrEqual(waters[i - 1]!)
      }
    }
  })

  it('defaultBeanWeight and defaultWaterTemp, when defined, are positive finite numbers', () => {
    for (const preset of BREW_PRESETS) {
      if (preset.defaultBeanWeight !== undefined) {
        expect(Number.isFinite(preset.defaultBeanWeight), `preset ${preset.id} defaultBeanWeight finite`).toBe(true)
        expect(preset.defaultBeanWeight, `preset ${preset.id} defaultBeanWeight > 0`).toBeGreaterThan(0)
      }
      if (preset.defaultWaterTemp !== undefined) {
        expect(Number.isFinite(preset.defaultWaterTemp), `preset ${preset.id} defaultWaterTemp finite`).toBe(true)
        expect(preset.defaultWaterTemp, `preset ${preset.id} defaultWaterTemp > 0`).toBeGreaterThan(0)
      }
    }
  })

  it('all preset final water values are within 300g (form totalWater clamp threshold)', () => {
    for (const preset of BREW_PRESETS) {
      const lastStep = preset.steps[preset.steps.length - 1]!
      expect(lastStep.water, `preset ${preset.id} final water <= 300`).toBeLessThanOrEqual(300)
    }
  })
})
