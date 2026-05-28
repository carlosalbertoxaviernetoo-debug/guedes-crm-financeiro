import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from './button'

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: ButtonProps['variant']
  icon?: LucideIcon
}

export interface EmptyStateProps {
  /** Lucide icon to display at the top */
  icon?: LucideIcon
  /** Large emoji or custom node (overrides icon) */
  visual?: React.ReactNode
  title: string
  description?: string
  /** Primary CTA */
  action?: EmptyStateAction
  /** Secondary CTA */
  secondaryAction?: EmptyStateAction
  /** Extra content (custom node) below actions */
  children?: React.ReactNode
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: {
    wrapper: 'py-8 gap-3',
    iconWrapper: 'h-10 w-10',
    icon: 'h-5 w-5',
    title: 'text-sm font-semibold',
    description: 'text-xs max-w-xs',
  },
  md: {
    wrapper: 'py-12 gap-4',
    iconWrapper: 'h-14 w-14',
    icon: 'h-7 w-7',
    title: 'text-base font-semibold',
    description: 'text-sm max-w-sm',
  },
  lg: {
    wrapper: 'py-20 gap-5',
    iconWrapper: 'h-20 w-20',
    icon: 'h-10 w-10',
    title: 'text-xl font-semibold',
    description: 'text-base max-w-md',
  },
}

function EmptyState({
  icon: Icon,
  visual,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
  size = 'md',
}: EmptyStateProps) {
  const cfg = sizeConfig[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center w-full',
        cfg.wrapper,
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Visual */}
      {visual ? (
        <div className={cn(cfg.iconWrapper, 'flex items-center justify-center')}>{visual}</div>
      ) : Icon ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl bg-muted text-muted-foreground',
            cfg.iconWrapper
          )}
        >
          <Icon className={cn(cfg.icon)} />
        </div>
      ) : null}

      {/* Text */}
      <div className="flex flex-col gap-1.5 items-center">
        <h3 className={cn('text-foreground', cfg.title)}>{title}</h3>
        {description && (
          <p className={cn('text-muted-foreground leading-relaxed', cfg.description)}>
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action && (
            <Button
              variant={action.variant ?? 'brand'}
              size="md"
              onClick={action.onClick}
              {...(action.href ? { asChild: true } : {})}
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.href ? (
                <a href={action.href}>{action.label}</a>
              ) : (
                action.label
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? 'outline'}
              size="md"
              onClick={secondaryAction.onClick}
              {...(secondaryAction.href ? { asChild: true } : {})}
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}

      {children}
    </div>
  )
}

export { EmptyState }
