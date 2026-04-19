'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROAST_LEVELS, type RoastLevel } from '@/lib/types'
import { ROAST_COLORS } from '@/lib/roast-colors'

interface RoastPaletteProps {
  value: RoastLevel
  onChange: (level: RoastLevel) => void
}

export function RoastPalette({ value, onChange }: RoastPaletteProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RoastLevel)}>
      <SelectTrigger aria-label="Roast Level" className="w-full">
        <SelectValue placeholder="Select roast level" />
      </SelectTrigger>
      <SelectContent>
        {ROAST_LEVELS.map((level) => (
          <SelectItem key={level} value={level}>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full border border-border"
                style={{ backgroundColor: ROAST_COLORS[level] }}
                aria-hidden="true"
              />
              <span>{level}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
