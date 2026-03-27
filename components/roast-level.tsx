import { cn } from '@/lib/utils'
import { ROAST_LEVELS, type RoastLevel } from '@/lib/types'

interface RoastLevelProps {
  level: RoastLevel
  size?: 'sm' | 'md'
}

export function RoastLevel({ level, size = 'md' }: RoastLevelProps) {
  const currentLevelIndex = ROAST_LEVELS.indexOf(level)

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex gap-1',
        size === 'sm' ? 'gap-0.5' : 'gap-1'
      )}>
        {ROAST_LEVELS.map((roast, roastIndex) => (
          <div
            key={roast}
            className={cn(
              'rounded-full transition-colors',
              size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
              roastIndex <= currentLevelIndex
                ? 'bg-primary' 
                : 'bg-border'
            )}
          />
        ))}
      </div>
      <span className={cn(
        'text-muted-foreground',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        {level}
      </span>
    </div>
  )
}
