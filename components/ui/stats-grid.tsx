'use client'

import {
  ShoppingCart, DollarSign, TrendingUp, ReceiptText,
  Package, AlertTriangle, BarChart3, Users, Target,
  type LucideIcon,
} from 'lucide-react'
import { StatCard } from './stat-card'
import type { StatCardProps } from './stat-card'

// ── Icon registry ────────────────────────────────────────────────────────────
// Only plain strings cross the Server→Client boundary; icons are resolved here.

export type StatIconName =
  | 'shopping-cart'
  | 'dollar-sign'
  | 'trending-up'
  | 'receipt-text'
  | 'package'
  | 'alert-triangle'
  | 'bar-chart'
  | 'users'
  | 'target'

const ICON_MAP: Record<StatIconName, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'dollar-sign':   DollarSign,
  'trending-up':   TrendingUp,
  'receipt-text':  ReceiptText,
  'package':       Package,
  'alert-triangle': AlertTriangle,
  'bar-chart':     BarChart3,
  'users':         Users,
  'target':        Target,
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface StatItem {
  title: string
  value: string | number
  iconName: StatIconName
  iconVariant?: StatCardProps['iconVariant']
  changeLabel?: string
  change?: string
  changeValue?: number
}

// ── Component ────────────────────────────────────────────────────────────────

export function StatsGrid({
  items,
  cols = 4,
}: {
  items: StatItem[]
  cols?: 2 | 3 | 4
}) {
  const colClass =
    cols === 2 ? 'grid-cols-2' :
    cols === 3 ? 'grid-cols-2 lg:grid-cols-3' :
    'grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid ${colClass} gap-4`}>
      {items.map(({ iconName, ...rest }) => (
        <StatCard
          key={rest.title}
          {...rest}
          icon={ICON_MAP[iconName]}
        />
      ))}
    </div>
  )
}
