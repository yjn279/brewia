import { describe, expect, it, vi } from 'vitest'
import type { Metadata } from 'next'

// next/font/google は Vitest + jsdom 環境では動作しないためモックする
vi.mock('next/font/google', () => ({
  DM_Sans: () => ({ className: 'dm-sans', variable: '--font-sans' }),
  DM_Mono: () => ({ className: 'dm-mono', variable: '--font-mono' }),
}))

// globals.css は Vitest 環境では不要なためモックする
vi.mock('./globals.css', () => ({}))

import { metadata, viewport } from './layout'

describe('layout metadata', () => {
  it('metadata.manifest が "/manifest.webmanifest" である', () => {
    expect(metadata.manifest).toBe('/manifest.webmanifest')
  })

  it('metadata.appleWebApp.capable が true である', () => {
    expect(metadata.appleWebApp).toBeDefined()
    const appleWebApp = metadata.appleWebApp as Extract<Metadata['appleWebApp'], object>
    expect(appleWebApp.capable).toBe(true)
  })

  it('metadata.appleWebApp.title が "Brewia" である', () => {
    expect(metadata.appleWebApp).toBeDefined()
    const appleWebApp = metadata.appleWebApp as Extract<Metadata['appleWebApp'], object>
    expect(appleWebApp.title).toBe('Brewia')
  })

  it('metadata.appleWebApp.statusBarStyle が "black-translucent" である', () => {
    expect(metadata.appleWebApp).toBeDefined()
    const appleWebApp = metadata.appleWebApp as Extract<Metadata['appleWebApp'], object>
    expect(appleWebApp.statusBarStyle).toBe('black-translucent')
  })
})

describe('layout viewport（回帰防止）', () => {
  it('viewport.themeColor が "#4a3728" である', () => {
    expect(viewport.themeColor).toBe('#4a3728')
  })
})
