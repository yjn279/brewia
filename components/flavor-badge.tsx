import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FlavorBadgeProps {
  name: string
  className?: string
}

export function FlavorBadge({ name, className }: FlavorBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('rounded-full', className)}>
      {name}
    </Badge>
  )
}
