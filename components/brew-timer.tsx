'use client'

import { useState } from 'react'
import { Flag, Play, RotateCcw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  const clamped = Math.max(0, ms)
  const totalCentiseconds = Math.floor(clamped / 10)
  const centiseconds = totalCentiseconds % 100
  const totalSeconds = Math.floor(totalCentiseconds / 100)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  const cc = String(centiseconds).padStart(2, '0')

  return `${mm}:${ss}.${cc}`
}

export function BrewTimer({ status, elapsed, onStart, onLap, onStop, onReset }: BrewTimerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-2">
        {status === 'running' && (
          <span
            aria-hidden
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"
          />
        )}
        <span
          role="timer"
          aria-live="polite"
          aria-label="Elapsed time"
          className="font-mono text-3xl font-semibold tabular-nums"
        >
          {formatElapsed(elapsed)}
        </span>
      </div>

      <div className="flex gap-2">
        {status === 'idle' && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onStart}
          >
            <Play className="mr-1 h-4 w-4" />
            Start
          </Button>
        )}

        {status === 'running' && (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onLap}
            >
              <Flag className="mr-1 h-4 w-4" />
              Lap
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onStop}
            >
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          </>
        )}

        {status === 'stopped' && (
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>タイマーをリセット</AlertDialogTitle>
                <AlertDialogDescription>
                  リセットするとタイマーと抽出ステップ行も初期化されます。続行しますか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onReset()
                  }}
                >
                  リセット
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
