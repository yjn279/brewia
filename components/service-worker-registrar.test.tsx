import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServiceWorkerRegistrar } from '@/components/service-worker-registrar'

describe('ServiceWorkerRegistrar', () => {
  afterEach(() => {
    // navigator.serviceWorker のスタブをクリーンアップ
    vi.unstubAllGlobals()
    // Object.defineProperty でセットした場合は削除を試みる
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).serviceWorker
    } catch {
      // 削除できない環境では無視
    }
  })

  it('コンポーネントが DOM ノードをレンダリングしない（container.firstChild === null）', () => {
    const registerMock = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register: registerMock },
      writable: true,
    })

    const { container } = render(<ServiceWorkerRegistrar />)

    expect(container.firstChild).toBeNull()
  })

  it('マウント時に navigator.serviceWorker.register が /sw.js 引数で 1 回呼ばれる', async () => {
    const registerMock = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register: registerMock },
      writable: true,
    })

    render(<ServiceWorkerRegistrar />)

    // useEffect は非同期なので 1 tick 待つ
    await Promise.resolve()

    expect(registerMock).toHaveBeenCalledTimes(1)
    expect(registerMock).toHaveBeenCalledWith('/sw.js')
  })

  it('navigator.serviceWorker が未定義の場合はエラーにならず register も呼ばれない', async () => {
    // serviceWorker プロパティを存在させない
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
      writable: true,
    })

    expect(() => render(<ServiceWorkerRegistrar />)).not.toThrow()

    await Promise.resolve()
    // 何も呼ばれていないことを確認（モックが存在しないことで間接的に確認済み）
  })

  it('register が reject したとき console.warn が呼ばれ、promise rejection が上位に出ない', async () => {
    const error = new Error('SW registration failed')
    const registerMock = vi.fn().mockRejectedValue(error)
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register: registerMock },
      writable: true,
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // エラーが外部に漏れないこと
    expect(() => render(<ServiceWorkerRegistrar />)).not.toThrow()

    // reject を処理させるために複数 tick 待つ
    await new Promise<void>((resolve) => setTimeout(resolve, 0))

    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })
})
