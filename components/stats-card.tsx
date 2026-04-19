import { cn } from '@/lib/utils'
import { Surface } from '@/components/ui/surface'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  return (
    <Surface className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-mono text-2xl font-medium text-foreground">{value}</span>
    </Surface>
  )
}
