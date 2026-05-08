import { useCallback, useEffect, useRef, useState } from 'react'

export type BrewTimerStatus = 'idle' | 'running' | 'stopped'

export interface UseBrewTimerOptions {
  getNow?: () => number
}

export interface UseBrewTimerResult {
  status: BrewTimerStatus
  elapsed: number // ms
  start: () => void
  lap: () => void
  stop: () => void
  reset: () => void
}

export function useBrewTimer(options?: UseBrewTimerOptions): UseBrewTimerResult {
  const getNow = options?.getNow ?? (() => Date.now())
  const getNowRef = useRef(getNow)
  getNowRef.current = getNow

  const [status, setStatus] = useState<BrewTimerStatus>('idle')
  const [elapsed, setElapsed] = useState(0)

  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'idle') return prev
      startTimeRef.current = getNowRef.current()
      intervalRef.current = setInterval(() => {
        setElapsed(getNowRef.current() - (startTimeRef.current ?? getNowRef.current()))
      }, 50)
      return 'running'
    })
  }, [])

  const lap = useCallback(() => {
    // no-op: caller reads elapsed directly
  }, [])

  const stop = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'running') return prev
      clearTimer()
      return 'stopped'
    })
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    startTimeRef.current = null
    setElapsed(0)
    setStatus('idle')
  }, [clearTimer])

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return { status, elapsed, start, lap, stop, reset }
}
