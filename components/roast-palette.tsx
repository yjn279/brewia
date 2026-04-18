'use client'

import { useRef } from 'react'
import { ROAST_LEVELS, type RoastLevel } from '@/lib/types'
import { ROAST_COLORS } from '@/lib/roast-colors'
import { cn } from '@/lib/utils'

interface RoastPaletteProps {
  value: RoastLevel
  onChange: (level: RoastLevel) => void
}

export function RoastPalette({ value, onChange }: RoastPaletteProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let nextIdx: number | null = null

    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % ROAST_LEVELS.length
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + ROAST_LEVELS.length) % ROAST_LEVELS.length
    } else if (e.key === 'Home') {
      nextIdx = 0
    } else if (e.key === 'End') {
      nextIdx = ROAST_LEVELS.length - 1
    }

    if (nextIdx !== null) {
      e.preventDefault()
      onChange(ROAST_LEVELS[nextIdx])
      refs.current[nextIdx]?.focus()
    }
  }

  return (
    <div role="radiogroup" aria-label="Roast Level" className="flex flex-col gap-2">
      <span className="self-end text-sm text-muted-foreground" aria-live="polite" data-testid="roast-palette-readout">
        {value}
      </span>
      <div className="flex items-center gap-1.5">
        {ROAST_LEVELS.map((level, idx) => {
          const isSelected = level === value
          return (
            <button
              key={level}
              ref={(el) => {
                refs.current[idx] = el
              }}
              type="button"
              role="radio"
              aria-label={level}
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              style={{ backgroundColor: ROAST_COLORS[level] }}
              className={cn(
                'h-8 w-8 flex-shrink-0 rounded-full transition-transform',
                'border border-border',
                isSelected && 'ring-2 ring-ring ring-offset-2 ring-offset-background scale-110 z-10',
              )}
              onClick={() => onChange(level)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            />
          )
        })}
      </div>
    </div>
  )
}
