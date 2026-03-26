import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  return (
    <div className={cn(
      'flex flex-col gap-1 rounded-xl bg-card p-4 shadow-sm',
      className
    )}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-mono text-2xl font-medium text-foreground">{value}</span>
    </div>
  )
}
