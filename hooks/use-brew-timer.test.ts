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

  it('T2: initial state is idle/0; after start + 3000ms elapsed is running and >= 3000', () => {
    let now = 0
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)

    act(() => {
      result.current.start()
    })

    expect(result.current.status).toBe('running')

    act(() => {
      now = 3000
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.status).toBe('running')
    expect(result.current.elapsed).toBeGreaterThanOrEqual(3000)
  })

  // T3a: stop() from running freezes elapsed and status='stopped'; further time does NOT advance elapsed; reset() restores idle/0
  it('T3a: after start + 7000ms, stop() sets stopped/frozen; advance 3000ms more does not change elapsed; reset() sets idle/0', () => {
    let now = 0
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 7000
      vi.advanceTimersByTime(7000)
    })

    expect(result.current.elapsed).toBeGreaterThanOrEqual(7000)

    act(() => {
      result.current.stop()
    })

    expect(result.current.status).toBe('stopped')
    const frozenElapsed = result.current.elapsed
    expect(frozenElapsed).toBeGreaterThanOrEqual(7000)

    // Advance more time — elapsed must stay frozen (interval cleared on stop)
    act(() => {
      now = 10000
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.elapsed).toBe(frozenElapsed)

    // reset() from stopped
    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  // T3b: reset() directly from running (without stopping first) still works
  it('T3b: after start + 7000ms, reset() from running directly sets idle/0 and stops further updates', () => {
    let now = 0
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 7000
      vi.advanceTimersByTime(7000)
    })

    expect(result.current.elapsed).toBeGreaterThanOrEqual(7000)

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)

    // Advance more time; elapsed must stay 0 because interval was cleared
    act(() => {
      now = 10000
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.elapsed).toBe(0)
  })

  // start() is a no-op from 'stopped' (no resume in this iteration)
  it('start no-op from stopped: after stop, calling start() does not resume or restart', () => {
    let now = 0
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 5000
      vi.advanceTimersByTime(5000)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.status).toBe('stopped')
    const frozenElapsed = result.current.elapsed

    // Attempt to start from stopped — should be no-op
    act(() => {
      result.current.start()
    })

    expect(result.current.status).toBe('stopped')

    // Advance time — elapsed must not change
    act(() => {
      now = 8000
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.elapsed).toBe(frozenElapsed)
  })

  // stop() from idle does not throw and status stays idle
  it('stop no-op from idle: stop() from idle does not throw and status stays idle', () => {
    let now = 0
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    expect(result.current.status).toBe('idle')

    act(() => {
      result.current.stop()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  it('T7: unmount clears interval — no setState-on-unmounted-component error', () => {
    let now = 0
    const getNow = () => now

    const { result, unmount } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 1000
      vi.advanceTimersByTime(1000)
    })

    const errorSpy = vi.spyOn(console, 'error')

    unmount()

    act(() => {
      now = 5000
      vi.advanceTimersByTime(4000)
    })

    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('lap no-op: lap does not throw and does not change status/elapsed', () => {
    let now = 0
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 2000
      vi.advanceTimersByTime(2000)
    })

    const elapsedBeforeLap = result.current.elapsed

    act(() => {
      result.current.lap()
    })

    expect(result.current.status).toBe('running')
    // elapsed should still be >= 2000 (not reset by lap)
    expect(result.current.elapsed).toBeGreaterThanOrEqual(2000)
    // lap did not reduce elapsed
    expect(result.current.elapsed).toBeGreaterThanOrEqual(elapsedBeforeLap)
  })

  it('start is a no-op when already running', () => {
    let now = 0
    const getNow = () => now

    const { result } = renderHook(() => useBrewTimer({ getNow }))

    act(() => {
      result.current.start()
    })

    act(() => {
      now = 1000
      vi.advanceTimersByTime(1000)
    })

    // Call start again while running — should not reset the timer
    act(() => {
      result.current.start()
    })

    act(() => {
      now = 2000
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.elapsed).toBeGreaterThanOrEqual(2000)
  })
})
