import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InfoRowProps {
  icon: ReactNode
  children: ReactNode
  className?: string
}

export function InfoRow({ icon, children, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="text-muted-foreground shrink-0">{icon}</div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}
