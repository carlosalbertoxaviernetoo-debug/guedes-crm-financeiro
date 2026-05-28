import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
    'text-xs font-medium leading-none transition-colors',
    'border border-transparent',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-brand-muted text-brand border-brand/20',
        warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        outline: 'bg-transparent text-foreground border-border',
        muted: 'bg-muted text-muted-foreground',
        purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
        blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
        orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
      },
      size: {
        sm: 'px-2 py-px text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional dot indicator shown before label */
  dot?: boolean
}

function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full bg-current opacity-80 shrink-0')}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
