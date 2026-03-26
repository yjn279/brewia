import { cn } from '@/lib/utils'

interface RoastLevelProps {
  level: number
  size?: 'sm' | 'md'
}

const roastLabels = ['', 'Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark']

export function RoastLevel({ level, size = 'md' }: RoastLevelProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex gap-1',
        size === 'sm' ? 'gap-0.5' : 'gap-1'
      )}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-colors',
              size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
              i <= level 
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
        {roastLabels[level]}
      </span>
    </div>
  )
}
