import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  leading?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ leading, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-3">{leading}</div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

interface HeaderActionProps extends ComponentProps<typeof Link> {
  variant?: 'ghost' | 'secondary' | 'primary'
  className?: string
}

export function HeaderAction({ variant = 'ghost', className, ...props }: HeaderActionProps) {
  const variantClasses = {
    ghost: 'hover:bg-secondary',
    secondary: 'border border-border bg-card hover:bg-secondary',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  }

  return (
    <Link
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
