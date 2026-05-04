import { cn } from '@/lib/utils'

interface TasteBarsProps {
  aroma: number
  acidity: number
  sweetness: number
  body: number
  overall: number
  className?: string
}

const BAR_MAX = 5

function TasteBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, (value / BAR_MAX) * 100))
  const display = value === 0 ? '-' : String(value)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">{display}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={BAR_MAX}
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-primary transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function TasteBars({ aroma, acidity, sweetness, body, overall, className }: TasteBarsProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <TasteBar label="Aroma" value={aroma} />
      <TasteBar label="Acidity" value={acidity} />
      <TasteBar label="Sweetness" value={sweetness} />
      <TasteBar label="Body" value={body} />
      <TasteBar label="Overall" value={overall} />
    </div>
  )
}
