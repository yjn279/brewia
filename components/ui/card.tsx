import { Slot } from '@radix-ui/react-slot'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends ComponentProps<'div'> {
  asChild?: boolean
  interactive?: boolean
}

export function Card({
  asChild = false,
  interactive = false,
  className,
  ...props
}: CardProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      data-slot="card"
      className={cn(
        'rounded-xl bg-card p-4 shadow-sm',
        interactive && 'transition-all hover:shadow-md active:scale-[0.98]',
        className
      )}
      {...props}
    />
  )
}
