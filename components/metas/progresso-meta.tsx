'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Animated number
// ---------------------------------------------------------------------------

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = value
    const controls = animate(from, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return controls.stop
  }, [value])

  return <>{display.toFixed(1)}</>
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProgressoMetaProps {
  realizado: number
  meta: number | null
  percentual: number
  label?: string
  showValues?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// ---------------------------------------------------------------------------
// Color logic
// ---------------------------------------------------------------------------

function getColorClass(pct: number) {
  if (pct >= 80) return 'bg-brand'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getGlowClass(pct: number) {
  if (pct >= 80) return 'shadow-[0_0_16px_2px_hsl(142_76%_36%/0.5)]'
  if (pct >= 40) return 'shadow-[0_0_16px_2px_hsl(38_92%_50%/0.4)]'
  return 'shadow-[0_0_16px_2px_hsl(0_84%_60%/0.4)]'
}

function getTextColorClass(pct: number) {
  if (pct >= 80) return 'text-brand'
  if (pct >= 40) return 'text-amber-500'
  return 'text-red-500'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProgressoMeta({
  realizado,
  meta,
  percentual,
  label = 'Meta mensal',
  showValues = true,
  size = 'lg',
}: ProgressoMetaProps) {
  const clampedPct = Math.min(Math.max(percentual, 0), 100)
  const isNearGoal = clampedPct >= 90 && clampedPct < 100
  const isComplete = clampedPct >= 100

  const barColor = getColorClass(clampedPct)
  const glowClass = getGlowClass(clampedPct)
  const textColor = getTextColorClass(clampedPct)

  const barHeightClass = size === 'lg' ? 'h-5' : size === 'md' ? 'h-3.5' : 'h-2'
  const textSizeClass = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'

  return (
    <div className="flex flex-col gap-4">
      {/* Percentage hero */}
      {size === 'lg' && (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
              {label}
            </p>
            <div className={cn('font-bold tabular-nums leading-none', textSizeClass, textColor)}>
              <AnimatedNumber value={clampedPct} />%
            </div>
          </div>

          {showValues && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Realizado</p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(realizado)}
              </p>
              {meta !== null && (
                <>
                  <p className="text-xs text-muted-foreground mt-1">Meta</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {formatCurrency(meta)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bar */}
      <div
        className={cn(
          'relative w-full rounded-full bg-muted overflow-hidden',
          barHeightClass
        )}
      >
        <motion.div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full',
            barColor,
            (isNearGoal || isComplete) && glowClass
          )}
          initial={{ width: '0%' }}
          animate={{ width: `${clampedPct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {/* Shimmer */}
          {size === 'lg' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
          )}
        </motion.div>

        {/* Pulsing glow when close to goal */}
        {isNearGoal && (
          <motion.div
            className={cn(
              'absolute right-0 top-0 h-full w-3 rounded-full',
              barColor,
              'blur-sm opacity-60'
            )}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Values row for sm/md sizes */}
      {showValues && size !== 'lg' && meta !== null && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={cn('font-semibold', textColor)}>
            {formatCurrency(realizado)}
          </span>
          <span>{formatCurrency(meta)}</span>
        </div>
      )}

      {/* Completion message */}
      {isComplete && size === 'lg' && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-brand text-center"
        >
          Meta atingida! Parabens! 🎉
        </motion.p>
      )}
    </div>
  )
}
