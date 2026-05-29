'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useInView, animate, type Variants } from 'framer-motion'
import Image from 'next/image'
import {
  Target, TrendingUp, CheckCircle2, XCircle, Plus, Calendar,
  Banknote, Clock, BarChart3, Flame, Trophy, ChevronDown, ChevronRight,
  MessageSquare, CalendarRange, Trash2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { toast } from 'sonner'

import {
  getProgressoMeta, getMetaMensal, getMetaAnual, getMetasPeriodo,
  getProgressoPeriodo, deleteMeta,
} from '@/lib/actions/metas'
import { formatCurrency, getMesAtual, getAnoAtual, MESES_NOMES } from '@/lib/utils'
import { MetaForm } from '@/components/metas/meta-form'
import type { Meta } from '@/types'

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
}

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------

function AnimatedCounter({
  value, prefix = '', suffix = '', decimals = 0, duration = 1.4,
  className = '', style,
}: {
  value: number; prefix?: string; suffix?: string; decimals?: number
  duration?: number; className?: string; style?: React.CSSProperties
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10px' })
  const prevRef = useRef(0)

  useEffect(() => {
    if (!inView) return
    const from = prevRef.current
    prevRef.current = value
    const controls = animate(from, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    })
    return controls.stop
  }, [value, inView, duration])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon, label, valueRaw, value = 0, decimals = 0,
  prefix = '', suffix = '', color = GOLD, delay = 0,
}: {
  icon: React.ElementType; label: string; valueRaw?: string
  value?: number; decimals?: number; prefix?: string; suffix?: string
  color?: string; delay?: number
}) {
  return (
    <motion.div
      variants={fadeUp} transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className="relative rounded-2xl p-4 cursor-default overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl pointer-events-none"
        style={{ background: `${color}20` }} />
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5"
            style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
          <p className="text-lg font-black text-white leading-none tabular-nums">
            {valueRaw ?? (
              <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            )}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Delete confirm button (inline)
// ---------------------------------------------------------------------------

function DeleteButton({ onConfirm, loading }: { onConfirm: () => void; loading?: boolean }) {
  const [confirm, setConfirm] = useState(false)

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setConfirm(false)}
          className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
        >
          Não
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          {loading ? '...' : 'Sim'}
        </button>
      </div>
    )
  }

  return (
    <motion.button
      onClick={() => setConfirm(true)}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
      title="Excluir meta"
    >
      <Trash2 className="w-3 h-3" />
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Progress bar card (active goal)
// ---------------------------------------------------------------------------

function ProgressCard({
  label, sublabel, realizado, meta, percentual,
  icon: Icon = Target, color = GOLD, showPrediction, metaId, onDeleted,
}: {
  label: string; sublabel?: string; realizado: number; meta: number | null
  percentual: number; icon?: React.ElementType; color?: string
  showPrediction?: string | null; metaId?: string | null; onDeleted?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const pct = Math.min(Math.max(percentual, 0), 100)
  const barColor = pct >= 80 ? GOLD : pct >= 40 ? '#f59e0b' : '#ef4444'
  const isComplete = pct >= 100
  const isNear = pct >= 90 && !isComplete
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!metaId) return
    setDeleting(true)
    const r = await deleteMeta(metaId)
    setDeleting(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Meta excluída.')
    onDeleted?.()
  }

  return (
    <motion.div
      ref={ref} variants={fadeUp} whileHover={{ y: -2 }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${pct >= 80 ? GOLD_D + '0.2)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: pct >= 80 ? `0 0 40px ${GOLD_D}0.07)` : '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {pct >= 80 && (
        <div className="absolute top-0 left-10 right-10 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-wide">{label}</p>
            {sublabel && (
              <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
                {sublabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.6 }}
            >
              <Trophy className="w-5 h-5" style={{ color: GOLD }} />
            </motion.div>
          )}
          {metaId && onDeleted && <DeleteButton onConfirm={handleDelete} loading={deleting} />}
        </div>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-4xl font-black tabular-nums leading-none" style={{ color: barColor }}>
            <AnimatedCounter value={pct} suffix="%" decimals={1} />
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            da meta atingida
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Realizado</p>
          <p className="text-sm font-bold text-white">{formatCurrency(realizado)}</p>
          {meta && (
            <>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Meta</p>
              <p className="text-sm font-semibold" style={{ color: GOLD }}>{formatCurrency(meta)}</p>
            </>
          )}
        </div>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background: isComplete
              ? `linear-gradient(90deg, ${GOLD}, #f5c842)`
              : pct >= 40 ? '#f59e0b' : '#ef4444',
            boxShadow: inView && pct >= 80 ? `0 0 12px ${GOLD_D}0.5)` : 'none',
          }}
          initial={{ width: '0%' }}
          animate={inView ? { width: `${pct}%` } : { width: '0%' }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2.5s_infinite]" />
        </motion.div>
        {isNear && (
          <motion.div
            className="absolute right-0 top-0 h-full w-4 rounded-full blur-sm"
            style={{ background: barColor, opacity: 0.6 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </div>

      {showPrediction && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Clock className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
          <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{showPrediction}</p>
        </motion.div>
      )}

      {isComplete && (
        <motion.p
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center text-xs font-bold mt-3 uppercase tracking-widest"
          style={{ color: GOLD }}
        >
          🎉 Meta atingida!
        </motion.p>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Realized (history) meta row — compact card for past goals
// ---------------------------------------------------------------------------

function RealizedCard({
  label, sublabel, realizado, meta, percentual, observacoes,
  metaId, onDeleted, index,
}: {
  label: string; sublabel?: string; realizado: number; meta: number
  percentual: number; observacoes?: string | null
  metaId?: string | null; onDeleted?: () => void; index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-5px' })
  const pct = Math.min(Math.max(percentual, 0), 100)
  const achieved = pct >= 100
  const barColor = achieved ? GOLD : pct >= 60 ? '#f59e0b' : '#ef4444'
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!metaId) return
    setDeleting(true)
    const r = await deleteMeta(metaId)
    setDeleting(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Meta excluída.')
    onDeleted?.()
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
      className="relative rounded-xl p-3.5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        opacity: 0.85,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div>
            <p className="text-xs font-black text-white">{label}</p>
            {sublabel && (
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {sublabel}
              </p>
            )}
          </div>
          <span
            className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest"
            style={achieved
              ? { background: GOLD_D + '0.15)', color: GOLD, border: `1px solid ${GOLD_D}0.25)` }
              : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
            }
          >
            {achieved ? '✓ Atingida' : 'Não atingida'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-black tabular-nums" style={{ color: barColor }}>{pct.toFixed(1)}%</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {formatCurrency(realizado)} / {formatCurrency(meta)}
            </p>
          </div>
          {metaId && onDeleted && <DeleteButton onConfirm={handleDelete} loading={deleting} />}
        </div>
      </div>

      {/* Thin bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full" style={{ background: barColor }}
          initial={{ width: '0%' }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {observacoes && (
        <div className="flex items-start gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{observacoes}</p>
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Period meta card (for active periods)
// ---------------------------------------------------------------------------

function PeriodoCard({
  meta, index, onDeleted,
}: {
  meta: Meta & { realizado?: number }
  index: number
  onDeleted?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10px' })
  const pct = meta.valor > 0 && meta.realizado != null
    ? Math.min(Math.round(((meta.realizado ?? 0) / meta.valor) * 100), 100)
    : 0
  const barColor = pct >= 80 ? GOLD : pct >= 40 ? '#f59e0b' : '#ef4444'
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const r = await deleteMeta(meta.id)
    setDeleting(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Meta excluída.')
    onDeleted?.()
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative rounded-2xl p-4 overflow-hidden cursor-default"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          <div>
            <p className="text-xs font-bold text-white">
              {meta.data_inicio
                ? new Date(meta.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                : '?'}{' '}
              →{' '}
              {meta.data_fim
                ? new Date(meta.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                : '?'}
            </p>
            <p className="text-[10px] font-bold mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Meta: {formatCurrency(meta.valor)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tabular-nums" style={{ color: barColor }}>{pct}%</span>
          <DeleteButton onConfirm={handleDelete} loading={deleting} />
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full" style={{ background: barColor }}
          initial={{ width: '0%' }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {meta.observacoes && (
        <div className="flex items-start gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{meta.observacoes}</p>
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Custom recharts tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs"
      style={{ background: '#0d1829', border: `1px solid ${GOLD_D}0.25)`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="font-black text-white mb-1.5 uppercase tracking-wider">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span className="font-bold" style={{ color: p.color }}>{p.name}: </span>
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section collapse header
// ---------------------------------------------------------------------------

function SectionHeader({
  label, count, open, onToggle,
}: {
  label: string; count?: number; open: boolean; onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-2 py-2 group"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          {label}
        </span>
        {count != null && count > 0 && (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black"
            style={{ background: GOLD_D + '0.12)', color: GOLD }}>
            {count}
          </span>
        )}
      </div>
      <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
        <ChevronDown className="w-3.5 h-3.5 group-hover:opacity-80 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.3)' }} />
      </motion.div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MesRow {
  mes: number
  nome: string
  meta: number | null
  metaId: string | null
  observacoes: string | null
  realizado: number
  percentual: number
  atingida: boolean | null
}

// ---------------------------------------------------------------------------
// Prediction helper
// ---------------------------------------------------------------------------

function calcPrediction(realizado: number, meta: number, mes: number, ano: number): string | null {
  if (!meta || meta <= 0 || realizado <= 0) return null
  const now = new Date()
  const day = now.getDate()
  const daysInMonth = new Date(ano, mes, 0).getDate()
  if (day === 0) return null
  const daily = realizado / day
  if (daily <= 0) return null
  const needed = Math.ceil(meta / daily)
  if (needed <= daysInMonth) {
    const left = needed - day
    if (left <= 0) return 'Meta atingida ou prestes a ser atingida!'
    return `No ritmo atual, a meta será atingida em ~${left} dia${left > 1 ? 's' : ''}.`
  }
  return 'No ritmo atual, a meta não será atingida este mês.'
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MetasPage() {
  const mes = getMesAtual()
  const ano = getAnoAtual()

  const [progresso, setProgresso] = useState<{
    meta: number | null; realizado: number; percentual: number; restante: number
  } | null>(null)
  const [currentMetaId, setCurrentMetaId] = useState<string | null>(null)
  const [currentMetaObs, setCurrentMetaObs] = useState<string | null>(null)
  const [metaAnual, setMetaAnual]       = useState<Meta | null>(null)
  const [realizadoAnual, setRealizadoAnual] = useState(0)
  const [mesesData, setMesesData]       = useState<MesRow[]>([])
  const [metasPeriodo, setMetasPeriodo] = useState<(Meta & { realizado?: number })[]>([])
  const [loading, setLoading]           = useState(true)
  const [formOpen, setFormOpen]         = useState(false)
  const [activeSection, setActiveSection] = useState<'mensal' | 'anual' | 'periodo'>('mensal')

  // Collapse state for history sections
  const [historyMensalOpen, setHistoryMensalOpen] = useState(true)
  const [historyPeriodoOpen, setHistoryPeriodoOpen] = useState(true)

  async function fetchAll() {
    setLoading(true)
    try {
      const [progressoResult, anualResult, periodoResult, currentMetaResult] = await Promise.all([
        getProgressoMeta(mes, ano),
        getMetaAnual(ano),
        getMetasPeriodo(),
        getMetaMensal(mes, ano),
      ])

      if (progressoResult.data) setProgresso(progressoResult.data)
      if (anualResult.data) setMetaAnual(anualResult.data)

      // Track current month's meta ID for delete
      if (currentMetaResult.data) {
        setCurrentMetaId(currentMetaResult.data.id)
        setCurrentMetaObs(currentMetaResult.data.observacoes ?? null)
      } else {
        setCurrentMetaId(null)
        setCurrentMetaObs(null)
      }

      // All 12 months in parallel
      const monthResults = await Promise.all(
        Array.from({ length: 12 }, (_, i) =>
          Promise.all([getProgressoMeta(i + 1, ano), getMetaMensal(i + 1, ano)])
        )
      )

      const rows: MesRow[] = monthResults.map(([pResult, metaResult], i) => {
        const p  = pResult.data
        const mt = metaResult.data
        return {
          mes: i + 1,
          nome: MESES_NOMES[i].slice(0, 3),
          meta: mt?.valor ?? null,
          metaId: mt?.id ?? null,
          observacoes: mt?.observacoes ?? null,
          realizado: p?.realizado ?? 0,
          percentual: p?.percentual ?? 0,
          atingida: mt?.valor ? (p?.realizado ?? 0) >= mt.valor : null,
        }
      })
      setMesesData(rows)

      const total = rows.reduce((s, r) => s + r.realizado, 0)
      setRealizadoAnual(total)

      // Fetch progresso for period metas
      if (periodoResult.data?.length) {
        const withProgress = await Promise.all(
          periodoResult.data.map(async (m) => {
            if (!m.data_inicio || !m.data_fim) return m
            const r = await getProgressoPeriodo(m.data_inicio, m.data_fim)
            return { ...m, realizado: r.data?.realizado ?? 0 }
          })
        )
        setMetasPeriodo(withProgress)
      } else {
        setMetasPeriodo([])
      }
    } catch {
      toast.error('Erro ao carregar metas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const prediction = useMemo(() => {
    if (!progresso?.meta || !progresso.realizado) return null
    return calcPrediction(progresso.realizado, progresso.meta, mes, ano)
  }, [progresso, mes, ano])

  const percentualAnual = useMemo(() => {
    if (!metaAnual?.valor || metaAnual.valor <= 0) return 0
    return Math.min(Math.round((realizadoAnual / metaAnual.valor) * 10000) / 100, 100)
  }, [metaAnual, realizadoAnual])

  // Derived data
  const hasCurrentMeta   = (progresso?.meta ?? null) !== null
  const pastMonthsMetas  = mesesData.filter(r => r.mes < mes && r.meta !== null)
  const chartData        = mesesData.filter(r => r.meta !== null || r.realizado > 0)
  const hasMonthlyData   = mesesData.some(r => r.meta !== null || r.realizado > 0)

  const today = new Date().toISOString().split('T')[0]
  const activePeriods    = metasPeriodo.filter(m => !m.data_fim || m.data_fim >= today)
  const completedPeriods = metasPeriodo.filter(m => m.data_fim && m.data_fim < today)

  function handleMetaSaved() {
    setFormOpen(false)
    fetchAll()
  }

  // Skeleton loading
  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
          <div>
            <div className="h-6 w-28 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-3 w-40 rounded-lg bg-white/5 animate-pulse mt-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/3 animate-pulse"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
          ))}
        </div>
        <div className="h-56 rounded-2xl bg-white/3 animate-pulse"
          style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
      </div>
    )
  }

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="space-y-6 max-w-5xl"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              filter: [
                'drop-shadow(0 0 4px rgba(212,160,23,0.2))',
                'drop-shadow(0 0 12px rgba(212,160,23,0.6))',
                'drop-shadow(0 0 4px rgba(212,160,23,0.2))',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image src="/guedes logo.jpg" alt="Guedes Outfit" width={32} height={32}
              className="rounded-full object-cover" />
          </motion.div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.12em] leading-tight">Metas</h2>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              Faturamento & objetivos
            </p>
          </div>
        </div>

        <motion.button
          onClick={() => setFormOpen(true)}
          whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #d4a017 0%, #f5c842 50%, #d4a017 100%)',
            color: '#080c14',
            boxShadow: '0 4px 20px rgba(212,160,23,0.3)',
          }}
        >
          <Plus className="w-4 h-4" />
          Nova meta
        </motion.button>
      </motion.div>

      {/* ── Stats row — only when active monthly goal exists ── */}
      <AnimatePresence>
        {hasCurrentMeta && progresso && (
          <motion.div
            key="stats"
            variants={fadeIn}
            initial="hidden" animate="show" exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <StatCard
              icon={Target} label="Meta mensal"
              valueRaw={formatCurrency(progresso.meta!)} color={GOLD}
            />
            <StatCard
              icon={Banknote} label="Realizado"
              valueRaw={formatCurrency(progresso.realizado)} color="#60a5fa"
            />
            <StatCard
              icon={TrendingUp} label="Restante"
              valueRaw={progresso.restante > 0 ? formatCurrency(progresso.restante) : '✓ Atingida!'}
              color={progresso.restante === 0 ? GOLD : '#f59e0b'}
            />
            <StatCard
              icon={Flame} label="% Atingida"
              value={progresso.percentual} decimals={1} suffix="%"
              color={progresso.percentual >= 80 ? GOLD : progresso.percentual >= 40 ? '#f59e0b' : '#ef4444'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section tabs ──────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {[
          { id: 'mensal' as const,  icon: Calendar,     label: 'Mensal'   },
          { id: 'anual' as const,   icon: BarChart3,     label: 'Anual'    },
          { id: 'periodo' as const, icon: CalendarRange, label: 'Períodos' },
        ].map(({ id, icon: Icon, label }) => {
          const active = activeSection === id
          return (
            <motion.button
              key={id}
              onClick={() => setActiveSection(id)}
              whileHover={active ? {} : { y: -2 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors duration-150"
              style={{
                background: active ? GOLD_D + '0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? GOLD_D + '0.35)' : 'rgba(255,255,255,0.06)'}`,
                color: active ? GOLD : 'rgba(255,255,255,0.35)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'periodo' && metasPeriodo.length > 0 && (
                <span className="px-1 rounded text-[9px] font-black"
                  style={{ background: GOLD_D + '0.2)', color: GOLD }}>
                  {metasPeriodo.length}
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* ── Content ───────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ══ MENSAL ══════════════════════════════════════ */}
        {activeSection === 'mensal' && (
          <motion.div key="mensal" variants={container} initial="hidden" animate="show"
            exit={{ opacity: 0, y: 8 }} className="space-y-4">

            {/* Current month — active goal or empty state */}
            {hasCurrentMeta && progresso ? (
              <ProgressCard
                label={`${MESES_NOMES[mes - 1]} ${ano}`}
                sublabel="Mês atual"
                realizado={progresso.realizado}
                meta={progresso.meta}
                percentual={progresso.percentual}
                icon={Calendar}
                showPrediction={prediction}
                metaId={currentMetaId}
                onDeleted={fetchAll}
              />
            ) : (
              <motion.div
                variants={fadeUp}
                className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Target className="w-8 h-8" style={{ color: GOLD_D + '0.35)' }} />
                <p className="text-sm font-bold text-white">
                  Sem meta para {MESES_NOMES[mes - 1]} {ano}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Defina uma meta mensal para acompanhar seu progresso
                </p>
                <motion.button
                  onClick={() => setFormOpen(true)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider"
                  style={{ background: GOLD_D + '0.12)', border: `1px solid ${GOLD_D}0.3)`, color: GOLD }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Definir meta de {MESES_NOMES[mes - 1]}
                </motion.button>
              </motion.div>
            )}

            {/* Past months history */}
            {pastMonthsMetas.length > 0 && (
              <motion.div variants={fadeUp} className="space-y-2">
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                  <SectionHeader
                    label="Meses anteriores"
                    count={pastMonthsMetas.length}
                    open={historyMensalOpen}
                    onToggle={() => setHistoryMensalOpen(v => !v)}
                  />
                </div>
                <AnimatePresence>
                  {historyMensalOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-2 overflow-hidden"
                    >
                      {pastMonthsMetas.map((row, i) => (
                        <RealizedCard
                          key={row.mes}
                          index={i}
                          label={MESES_NOMES[row.mes - 1]}
                          sublabel={String(ano)}
                          realizado={row.realizado}
                          meta={row.meta!}
                          percentual={row.percentual}
                          observacoes={row.observacoes}
                          metaId={row.metaId}
                          onDeleted={fetchAll}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Bar chart */}
            {chartData.length > 0 && (
              <motion.div variants={fadeUp} className="relative rounded-2xl p-5 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: GOLD_D + '0.12)', border: `1px solid ${GOLD_D}0.2)` }}>
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-wide">Meta vs Realizado</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>{ano}</p>
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={14} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="nome" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                        width={40} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="meta" name="Meta" fill="rgba(255,255,255,0.07)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="realizado" name="Realizado" radius={[3, 3, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.mes}
                            fill={entry.atingida ? GOLD : entry.mes === mes ? '#f59e0b' : 'rgba(255,255,255,0.25)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Monthly table — only months with data */}
            {hasMonthlyData && (
              <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="absolute top-0 left-10 right-10 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)' }} />
                <div className="flex items-center gap-2 p-5 pb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: GOLD_D + '0.12)', border: `1px solid ${GOLD_D}0.2)` }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-wide">Progresso Mensal</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>{ano}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['Mês', 'Meta', 'Realizado', '%', 'Status'].map((h, i) => (
                          <th key={h}
                            className={`py-2.5 px-4 text-[10px] font-black uppercase tracking-[0.2em] ${i > 0 ? 'text-right' : 'text-left'} ${i === 4 ? 'text-center' : ''}`}
                            style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mesesData.map((row, i) => {
                        const isCurrent = row.mes === mes
                        return (
                          <motion.tr
                            key={row.mes}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }}
                            className="group"
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: isCurrent ? GOLD_D + '0.04)' : 'transparent',
                            }}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{MESES_NOMES[row.mes - 1]}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest"
                                    style={{ background: GOLD_D + '0.15)', color: GOLD, border: `1px solid ${GOLD_D}0.25)` }}>
                                    Atual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {row.meta ? formatCurrency(row.meta) : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-bold text-white">
                                {row.realizado > 0 ? formatCurrency(row.realizado) : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {row.meta ? (
                                <span className="text-sm font-bold tabular-nums"
                                  style={{ color: row.percentual >= 80 ? GOLD : row.percentual >= 40 ? '#f59e0b' : '#ef4444' }}>
                                  {row.percentual.toFixed(1)}%
                                </span>
                              ) : (
                                <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center">
                                {row.atingida === true ? (
                                  <CheckCircle2 className="w-4 h-4" style={{ color: GOLD }} />
                                ) : row.atingida === false ? (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ══ ANUAL ════════════════════════════════════════ */}
        {activeSection === 'anual' && (
          <motion.div key="anual" variants={container} initial="hidden" animate="show"
            exit={{ opacity: 0, y: 8 }} className="space-y-5">

            {metaAnual ? (
              <ProgressCard
                label={`Meta Anual ${ano}`}
                sublabel="Acumulado"
                realizado={realizadoAnual}
                meta={metaAnual.valor}
                percentual={percentualAnual}
                icon={BarChart3}
                color="#a78bfa"
                metaId={metaAnual.id}
                onDeleted={fetchAll}
              />
            ) : (
              <motion.div
                variants={fadeUp}
                className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <BarChart3 className="w-8 h-8" style={{ color: 'rgba(167,139,250,0.35)' }} />
                <p className="text-sm font-bold text-white">Sem meta anual para {ano}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Defina um objetivo total de faturamento para o ano
                </p>
                <motion.button
                  onClick={() => setFormOpen(true)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider"
                  style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Definir meta anual
                </motion.button>
              </motion.div>
            )}

            {realizadoAnual > 0 && (
              <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Banknote} label="Faturado no ano"
                  valueRaw={formatCurrency(realizadoAnual)} color="#60a5fa"
                />
                <StatCard
                  icon={CheckCircle2} label="Meses atingidos"
                  valueRaw={String(mesesData.filter(r => r.atingida === true).length)}
                  color={GOLD}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ══ PERÍODO ══════════════════════════════════════ */}
        {activeSection === 'periodo' && (
          <motion.div key="periodo" variants={container} initial="hidden" animate="show"
            exit={{ opacity: 0, y: 8 }} className="space-y-4">

            {/* Active periods */}
            {activePeriods.length === 0 && completedPeriods.length === 0 ? (
              <motion.div
                variants={fadeUp}
                className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <CalendarRange className="w-10 h-10" style={{ color: GOLD_D + '0.3)' }} />
                <p className="text-sm font-bold text-white">Nenhuma meta de período</p>
                <p className="text-xs max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Metas de período rastreiam objetivos entre datas específicas — ideal para campanhas e eventos.
                </p>
                <motion.button
                  onClick={() => setFormOpen(true)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider"
                  style={{ background: GOLD_D + '0.12)', border: `1px solid ${GOLD_D}0.3)`, color: GOLD }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar meta de período
                </motion.button>
              </motion.div>
            ) : (
              <>
                {/* Active */}
                {activePeriods.length > 0 && (
                  <motion.div variants={fadeIn} className="space-y-3">
                    {activePeriods.length > 0 && completedPeriods.length > 0 && (
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Em andamento
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activePeriods.map((meta, i) => (
                        <PeriodoCard key={meta.id} meta={meta} index={i} onDeleted={fetchAll} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Completed / realized */}
                {completedPeriods.length > 0 && (
                  <motion.div variants={fadeUp} className="space-y-2">
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                      <SectionHeader
                        label="Períodos encerrados"
                        count={completedPeriods.length}
                        open={historyPeriodoOpen}
                        onToggle={() => setHistoryPeriodoOpen(v => !v)}
                      />
                    </div>
                    <AnimatePresence>
                      {historyPeriodoOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="grid gap-2 sm:grid-cols-2 overflow-hidden"
                        >
                          {completedPeriods.map((meta, i) => (
                            <RealizedCard
                              key={meta.id}
                              index={i}
                              label={
                                meta.data_inicio
                                  ? new Date(meta.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
                                    ' → ' +
                                    (meta.data_fim ? new Date(meta.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : '?')
                                  : 'Período'
                              }
                              realizado={meta.realizado ?? 0}
                              meta={meta.valor}
                              percentual={
                                meta.valor > 0 && meta.realizado != null
                                  ? Math.min(Math.round(((meta.realizado ?? 0) / meta.valor) * 100), 100)
                                  : 0
                              }
                              observacoes={meta.observacoes}
                              metaId={meta.id}
                              onDeleted={fetchAll}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                <motion.button
                  variants={fadeUp}
                  onClick={() => setFormOpen(true)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-wider"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px dashed ${GOLD_D}0.25)`,
                    color: GOLD_D + '0.6)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova meta de período
                </motion.button>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Form modal ────────────────────────────────── */}
      <MetaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleMetaSaved}
        initialMes={mes}
        initialAno={ano}
      />
    </motion.div>
  )
}
