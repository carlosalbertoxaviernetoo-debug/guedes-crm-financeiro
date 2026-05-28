'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './card'

// ---------------------------------------------------------------------------
// Sparkline — minimal SVG line chart
// ---------------------------------------------------------------------------

interface SparklineProps {
  data: number[]
  positive?: boolean
  className?: string
  height?: number
}

function Sparkline({ data, positive = true, className, height = 36 }: SparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const step = width / (data.length - 1)

  const points = data
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  const strokeColor = positive ? 'hsl(var(--brand))' : 'hsl(var(--destructive))'
  const fillColor = positive ? 'hsl(var(--brand) / 0.1)' : 'hsl(var(--destructive) / 0.1)'

  const firstPoint = `${0},${height}`
  const lastPoint = `${(data.length - 1) * step},${height}`
  const fillPoints = `${firstPoint} ${points} ${lastPoint}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <polygon points={fillPoints} fill={fillColor} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

export interface StatCardProps {
  title: string
  value: string | number
  /** Formatted change string, e.g. "+12%" or "-3.4%" */
  change?: string
  /** Change numeric value for auto positive/negative detection */
  changeValue?: number
  /** Short description below the change, e.g. "vs. mês anterior" */
  changeLabel?: string
  /** Lucide icon component */
  icon?: LucideIcon
  /** Icon background color variant */
  iconVariant?: 'default' | 'brand' | 'warning' | 'destructive' | 'info' | 'purple'
  /** Sparkline data array (numbers) */
  sparkline?: number[]
  /** Additional className for the card */
  className?: string
  /** Click handler (makes card interactive) */
  onClick?: () => void
  /** Loading skeleton state */
  loading?: boolean
}

const iconVariantClasses: Record<NonNullable<StatCardProps['iconVariant']>, string> = {
  default: 'bg-primary/10 text-primary',
  brand: 'bg-brand-muted text-brand',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
}

function StatCard({
  title,
  value,
  change,
  changeValue,
  changeLabel = 'vs. mês anterior',
  icon: Icon,
  iconVariant = 'brand',
  sparkline,
  className,
  onClick,
  loading = false,
}: StatCardProps) {
  const isPositive =
    changeValue !== undefined ? changeValue >= 0 : change ? !change.startsWith('-') : true
  const isNeutral = changeValue === 0

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const trendColor = isNeutral
    ? 'text-muted-foreground'
    : isPositive
    ? 'text-brand'
    : 'text-destructive'

  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-5">
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-7 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { y: 0 } : undefined}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={cn(
          'overflow-hidden',
          onClick && 'cursor-pointer transition-shadow hover:shadow-md',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left: text */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>

              <p className="text-2xl font-bold text-foreground tracking-tight leading-none">
                {value}
              </p>

              {(change || changeValue !== undefined) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-xs font-semibold',
                      trendColor
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {change ?? (changeValue !== undefined ? `${changeValue > 0 ? '+' : ''}${changeValue}%` : '')}
                  </span>
                  {changeLabel && (
                    <span className="text-xs text-muted-foreground">{changeLabel}</span>
                  )}
                </div>
              )}
            </div>

            {/* Right: icon + sparkline */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              {Icon && (
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                    iconVariantClasses[iconVariant]
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              )}
              {sparkline && sparkline.length >= 2 && (
                <Sparkline data={sparkline} positive={isPositive} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { StatCard, Sparkline }
