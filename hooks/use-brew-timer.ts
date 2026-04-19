import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseBrewTimerOptions {
  getNow?: () => number
}

export type BrewTimerStatus = 'idle' | 'running'

export interface UseBrewTimerResult {
  status: BrewTimerStatus
  elapsed: number
  start: () => void
  lap: () => void
  reset: () => void
}

export function useBrewTimer(options?: UseBrewTimerOptions): UseBrewTimerResult {
  const getNow = options?.getNow ?? (() => Date.now())

  const [status, setStatus] = useState<BrewTimerStatus>('idle')
  const [elapsed, setElapsed] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const statusRef = useRef<BrewTimerStatus>('idle')

  const start = useCallback(() => {
    if (statusRef.current === 'running') return

    const now = getNow()
    startTimeRef.current = now
    statusRef.current = 'running'
    setStatus('running')

    intervalRef.current = setInterval(() => {
      setElapsed(getNow() - (startTimeRef.current ?? getNow()))
    }, 100)
  }, [getNow])

  const lap = useCallback(() => {
    // no-op — exists for contract completeness and future use
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startTimeRef.current = null
    statusRef.current = 'idle'
    setStatus('idle')
    setElapsed(0)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return { status, elapsed, start, lap, reset }
}
