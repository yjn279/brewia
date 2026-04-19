'use client'

import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Flag, Play, RotateCcw, Square } from 'lucide-react'
import type { BrewTimerStatus } from '@/hooks/use-brew-timer'

export interface BrewTimerProps {
  status: BrewTimerStatus
  elapsed: number
  onStart: () => void
  onLap: () => void
  onStop: () => void
  onReset: () => void
}

function formatElapsed(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms))
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const centis = Math.floor((totalMs % 1000) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

export function BrewTimer({
  status,
  elapsed,
  onStart,
  onLap,
  onStop,
  onReset,
}: BrewTimerProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-secondary/30 p-4">
      <div className="flex items-center gap-2">
        {status === 'running' && (
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-red-500 animate-pulse"
          />
        )}
        <div
          role="timer"
          aria-live="polite"
          aria-label="Elapsed time"
          className="text-4xl font-mono tabular-nums tracking-tight"
        >
          {formatElapsed(elapsed)}
        </div>
      </div>
      <div className="flex flex-row gap-2 w-full">
        {status === 'idle' && (
          <Button type="button" className="flex-1" onClick={onStart}>
            <Play aria-hidden className="mr-2 h-4 w-4" />
            Start
          </Button>
        )}
        {status === 'running' && (
          <>
            <Button type="button" className="flex-1" onClick={onLap}>
              <Flag aria-hidden className="mr-2 h-4 w-4" />
              Lap
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onStop}>
              <Square aria-hidden className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
        {status === 'stopped' && (
          <Button type="button" variant="outline" className="flex-1" onClick={onReset}>
            <RotateCcw aria-hidden className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
