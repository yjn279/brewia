import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBrewTimer } from '@/hooks/use-brew-timer'

describe('useBrewTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial state is idle with elapsed 0', () => {
    const { result } = renderHook(() => useBrewTimer())
    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  it('start() transitions to running', () => {
    const { result } = renderHook(() => useBrewTimer())
    act(() => {
      result.current.start()
    })
    expect(result.current.status).toBe('running')
  })

  it('elapsed increases after start() with getNow injection', () => {
    let now = 1000
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 2000
      vi.advanceTimersByTime(50)
    })

    expect(result.current.elapsed).toBe(1000)

    act(() => {
      now = 3500
      vi.advanceTimersByTime(50)
    })

    expect(result.current.elapsed).toBe(2500)
  })

  it('stop() transitions to stopped and elapsed is frozen', () => {
    let now = 1000
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 2000
      vi.advanceTimersByTime(50)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.status).toBe('stopped')
    const frozenElapsed = result.current.elapsed

    act(() => {
      now = 5000
      vi.advanceTimersByTime(200)
    })

    expect(result.current.elapsed).toBe(frozenElapsed)
  })

  it('reset() from idle returns idle with elapsed 0', () => {
    const { result } = renderHook(() => useBrewTimer())
    act(() => {
      result.current.reset()
    })
    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  it('reset() from running returns idle with elapsed 0', () => {
    let now = 1000
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 2000
      vi.advanceTimersByTime(50)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  it('reset() from stopped returns idle with elapsed 0', () => {
    const { result } = renderHook(() => useBrewTimer())

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.stop()
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  it('start() is no-op when already running', () => {
    const { result } = renderHook(() => useBrewTimer())

    act(() => {
      result.current.start()
      result.current.start()
    })

    expect(result.current.status).toBe('running')
  })

  it('stop() is no-op when idle', () => {
    const { result } = renderHook(() => useBrewTimer())

    act(() => {
      result.current.stop()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  it('unmount during running clears the interval (no leak)', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { result, unmount } = renderHook(() => useBrewTimer())

    act(() => {
      result.current.start()
    })

    expect(result.current.status).toBe('running')

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
