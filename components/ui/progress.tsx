'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Track variants
// ---------------------------------------------------------------------------

const trackVariants = cva('relative w-full overflow-hidden rounded-full bg-secondary', {
  variants: {
    size: {
      xs: 'h-1',
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    },
  },
  defaultVariants: { size: 'md' },
})

// ---------------------------------------------------------------------------
// Indicator color variants
// ---------------------------------------------------------------------------

const indicatorVariants = cva(
  'h-full w-full flex-1 rounded-full transition-all duration-500 ease-out',
  {
    variants: {
      color: {
        default: 'bg-primary',
        brand: 'bg-brand',
        success: 'bg-brand',
        warning: 'bg-yellow-500',
        destructive: 'bg-destructive',
        info: 'bg-blue-500',
        purple: 'bg-purple-500',
      },
    },
    defaultVariants: { color: 'brand' },
  }
)

// ---------------------------------------------------------------------------
// Progress component
// ---------------------------------------------------------------------------

export interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'color'>,
    VariantProps<typeof trackVariants>,
    VariantProps<typeof indicatorVariants> {
  /** 0–100 */
  value?: number
  /** Show percentage label next to the bar */
  showLabel?: boolean
  /** Custom label formatter */
  formatLabel?: (value: number) => string
  /** Label position: 'right' (default) or 'top' */
  labelPosition?: 'right' | 'top'
  /** Animate a striped/shimmer pattern for indeterminate state */
  indeterminate?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      size,
      color,
      showLabel = false,
      formatLabel,
      labelPosition = 'right',
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value))
    const label = formatLabel ? formatLabel(clampedValue) : `${Math.round(clampedValue)}%`

    const track = (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(trackVariants({ size }), className)}
        value={indeterminate ? undefined : clampedValue}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            indicatorVariants({ color: color as ColorKey }),
            indeterminate && 'animate-[progress-indeterminate_1.5s_ease-in-out_infinite] origin-left'
          )}
          style={
            indeterminate
              ? undefined
              : { transform: `translateX(-${100 - clampedValue}%)` }
          }
        />
      </ProgressPrimitive.Root>
    )

    if (!showLabel) return track

    if (labelPosition === 'top') {
      return (
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{props['aria-label'] ?? 'Progresso'}</span>
            <span className="font-medium text-foreground">{label}</span>
          </div>
          {track}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1">{track}</div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-9 text-right shrink-0">
          {label}
        </span>
      </div>
    )
  }
)
Progress.displayName = ProgressPrimitive.Root.displayName

// ---------------------------------------------------------------------------
// Multi-segment progress bar
// ---------------------------------------------------------------------------

export interface ProgressSegment {
  value: number
  color?: ProgressProps['color']
  label?: string
}

export interface MultiProgressProps {
  segments: ProgressSegment[]
  size?: ProgressProps['size']
  className?: string
  showLegend?: boolean
}

type ColorKey = 'default' | 'brand' | 'success' | 'warning' | 'destructive' | 'info' | 'purple'
const colorClassMap: Record<ColorKey, string> = {
  default: 'bg-primary',
  brand: 'bg-brand',
  success: 'bg-brand',
  warning: 'bg-yellow-500',
  destructive: 'bg-destructive',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
}

function MultiProgress({ segments, size = 'md', className, showLegend = false }: MultiProgressProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  const sizeClass = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size ?? 'md']

  return (
    <div className="w-full flex flex-col gap-2">
      <div
        className={cn(
          'flex w-full overflow-hidden rounded-full bg-secondary',
          sizeClass,
          className
        )}
        role="progressbar"
        aria-valuenow={total}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0
          return (
            <div
              key={i}
              className={cn(
                'h-full transition-all duration-500',
                colorClassMap[(seg.color ?? 'brand') as ColorKey],
                i > 0 && 'ml-px'
              )}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  'h-2 w-2 rounded-full shrink-0',
                  colorClassMap[(seg.color ?? 'brand') as ColorKey]
                )}
              />
              {seg.label ?? `Segmento ${i + 1}`}
              <span className="text-foreground font-medium">{seg.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { Progress, MultiProgress }
