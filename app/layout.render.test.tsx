import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// next/font/google は Vitest + jsdom 環境では動作しないためモックする
vi.mock('next/font/google', () => ({
  DM_Sans: () => ({ className: 'dm-sans', variable: '--font-sans' }),
  DM_Mono: () => ({ className: 'dm-mono', variable: '--font-mono' }),
}))

// globals.css は Vitest 環境では不要なためモックする
vi.mock('./globals.css', () => ({}))

// next-themes は jsdom 環境で動作しないためモックする
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system' }),
}))

// @vercel/analytics は Vitest 環境では不要なためモックする
vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => null,
}))

// ServiceWorkerRegistrar は Vitest 環境では不要なためモックする
vi.mock('@/components/service-worker-registrar', () => ({
  ServiceWorkerRegistrar: () => null,
}))

// vi.hoisted で先に spy を定義し、vi.mock ファクトリから参照する
const { toasterMock } = vi.hoisted(() => ({
  toasterMock: vi.fn(() => <div data-testid="mock-toaster" />),
}))

// sonner の Toaster をモックして呼び出しをキャプチャする
vi.mock('@/components/ui/sonner', () => ({
  Toaster: toasterMock,
}))

import RootLayout from './layout'

describe('RootLayout に Toaster が含まれる（回帰防止）', () => {
  it('<Toaster /> が RootLayout 内でレンダリングされる', () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>,
    )

    expect(toasterMock).toHaveBeenCalled()
  })
})
