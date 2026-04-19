'use client'

import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'

export interface BrewTimerProps {
  status: 'idle' | 'running'
  elapsed: number
  onStart: () => void
  onLap: () => void
  onReset: () => void
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${mm}:${ss}`
}

export function BrewTimer({
  status,
  elapsed,
  onStart,
  onLap,
  onReset,
}: BrewTimerProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="timer"
        aria-live="polite"
        aria-label="Elapsed time"
        className="text-2xl font-mono tabular-nums"
      >
        {formatElapsed(elapsed)}
      </div>
      <div className="flex flex-row gap-2">
        {status === 'idle' ? (
          <Button type="button" onClick={onStart}>
            Start
          </Button>
        ) : (
          <>
            <Button type="button" onClick={onLap}>
              Lap
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
