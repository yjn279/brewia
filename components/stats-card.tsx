import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-black/5 bg-card/85 p-4 shadow-[0_16px_30px_-25px_rgba(38,28,8,0.7)] backdrop-blur-sm transition-transform hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <span className="rounded-full bg-primary/25 p-1.5 text-foreground">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <span className="font-mono text-2xl font-medium text-foreground">{value}</span>
    </div>
  )
}
