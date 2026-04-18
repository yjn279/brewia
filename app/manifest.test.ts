import { describe, expect, it } from 'vitest'
import manifest from './manifest'

describe('manifest', () => {
  it('returns a manifest object that is a plain object', () => {
    const result = manifest()
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
  })

  it('returns name "Brewia | Coffee Flight Journal"', () => {
    const result = manifest()
    expect(result.name).toBe('Brewia | Coffee Flight Journal')
  })

  it('returns short_name "Brewia"', () => {
    const result = manifest()
    expect(result.short_name).toBe('Brewia')
  })

  it('returns a non-empty description', () => {
    const result = manifest()
    expect(typeof result.description).toBe('string')
    expect((result.description ?? '').length).toBeGreaterThan(0)
  })

  it('returns start_url "/"', () => {
    const result = manifest()
    expect(result.start_url).toBe('/')
  })

  it('returns scope "/"', () => {
    const result = manifest()
    expect(result.scope).toBe('/')
  })

  it('returns display "standalone"', () => {
    const result = manifest()
    expect(result.display).toBe('standalone')
  })

  it('returns orientation "portrait"', () => {
    const result = manifest()
    expect(result.orientation).toBe('portrait')
  })

  it('returns theme_color "#4a3728"', () => {
    const result = manifest()
    expect(result.theme_color).toBe('#4a3728')
  })

  it('returns background_color "#ffffff"', () => {
    const result = manifest()
    expect(result.background_color).toBe('#ffffff')
  })

  it('icons array contains a 192x192 icon', () => {
    const result = manifest()
    const icons = result.icons ?? []
    const icon192 = icons.find(
      (icon) => icon.sizes === '192x192',
    )
    expect(icon192).toBeDefined()
    expect(typeof icon192?.src).toBe('string')
    expect((icon192?.src ?? '').length).toBeGreaterThan(0)
  })

  it('icons array contains a 512x512 icon', () => {
    const result = manifest()
    const icons = result.icons ?? []
    const icon512 = icons.find(
      (icon) => icon.sizes === '512x512',
    )
    expect(icon512).toBeDefined()
    expect(typeof icon512?.src).toBe('string')
    expect((icon512?.src ?? '').length).toBeGreaterThan(0)
  })

  it('icons array contains at least one icon with purpose "maskable"', () => {
    const result = manifest()
    const icons = result.icons ?? []
    const maskableIcon = icons.find(
      (icon) => icon.purpose === 'maskable',
    )
    expect(maskableIcon).toBeDefined()
    expect(typeof maskableIcon?.src).toBe('string')
    expect((maskableIcon?.src ?? '').length).toBeGreaterThan(0)
  })

  it('192/512 それぞれに any と maskable purpose が揃っている', () => {
    const result = manifest()
    for (const size of ['192x192', '512x512']) {
      const iconsOfSize = result.icons!.filter(i => i.sizes === size)
      expect(iconsOfSize.some(i => i.purpose === 'any')).toBe(true)
      expect(iconsOfSize.some(i => i.purpose === 'maskable')).toBe(true)
    }
  })

  it('each icon in the icons array has required fields src, sizes, and type', () => {
    const result = manifest()
    const icons = result.icons ?? []
    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) {
      expect(typeof icon.src).toBe('string')
      expect((icon.src).length).toBeGreaterThan(0)
      expect(typeof icon.sizes).toBe('string')
      expect(typeof icon.type).toBe('string')
    }
  })
})
