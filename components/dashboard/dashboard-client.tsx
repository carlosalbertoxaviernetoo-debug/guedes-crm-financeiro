'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, TrendingUp, ShoppingCart, Zap,
  Users, Package, AlertTriangle, Target,
  RotateCcw, Trophy, Star, Award, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { resetDashboard } from '@/lib/actions/periodos'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DashboardMetrics, PeriodoProdutoStats } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const CARD_BG     = 'linear-gradient(145deg, rgba(13,24,41,0.97) 0%, rgba(8,12,20,0.99) 100%)'
const CARD_BORDER = 'rgba(255,255,255,0.07)'

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const start = Date.now()
    let raf = 0
    function tick() {
      const p = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(target * ease)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setVal(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ─── Period stat card (resets with dashboard) ────────────────────────────────

function PeriodCard({
  title, rawValue, format, sub, icon: Icon, delay = 0,
}: {
  title: string
  rawValue: number
  format: (v: number) => string
  sub?: string
  icon: React.ElementType
  delay?: number
}) {
  const animated = useCountUp(rawValue)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 8px 32px ${GOLD_D}0.12), 0 0 0 1px ${GOLD_D}0.22)`,
        borderColor: `${GOLD_D}0.28)`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.35, delay, ease: EASE }}
      style={{
        borderRadius: 16, background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden', cursor: 'default',
      }}
    >
      {/* gold top-edge accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, ${GOLD_D}0.4) 70%, transparent 100%)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {title}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 13, height: 13, color: GOLD }} />
        </div>
      </div>
      <p style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {format(animated)}
      </p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, margin: 0 }}>{sub}</p>}
    </motion.div>
  )
}

// ─── Always-on card (never resets) ────────────────────────────────────────────

function AlwaysOnCard({
  title, rawValue, format, sub, icon: Icon, delay = 0, alert = false,
}: {
  title: string
  rawValue: number
  format: (v: number) => string
  sub?: string
  icon: React.ElementType
  delay?: number
  alert?: boolean
}) {
  const animated = useCountUp(rawValue)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        alert
          ? { scale: 1.02, boxShadow: '0 8px 28px rgba(239,68,68,0.14), 0 0 0 1px rgba(239,68,68,0.3)' }
          : { scale: 1.02, boxShadow: '0 8px 28px rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.1)' }
      }
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.35, delay, ease: EASE }}
      style={{
        borderRadius: 16,
        background: 'rgba(255,255,255,0.022)',
        border: `1px solid ${alert ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)'}`,
        padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {title}
        </span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: alert ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${alert ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color: alert ? '#ef4444' : 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
      <p style={{ color: alert ? '#ef4444' : 'rgba(255,255,255,0.75)', fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
        {format(animated)}
      </p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, margin: 0 }}>{sub}</p>}
    </motion.div>
  )
}

// ─── Top Clientes section ─────────────────────────────────────────────────────

const RANK_STYLES = [
  { icon: Trophy, color: GOLD,                      bg: `${GOLD_D}0.12)`,              border: `${GOLD_D}0.28)` },
  { icon: Award,  color: 'rgba(192,192,192,0.9)',   bg: 'rgba(192,192,192,0.08)',       border: 'rgba(192,192,192,0.2)' },
  { icon: Star,   color: 'rgba(176,141,87,0.9)',    bg: 'rgba(176,141,87,0.08)',        border: 'rgba(176,141,87,0.2)' },
]

function TopClienteRow({
  rank, nome, total_gasto, total_compras, delay,
}: {
  rank: number
  nome: string
  total_gasto: number
  total_compras: number
  delay: number
}) {
  const animated = useCountUp(total_gasto)
  const rs = RANK_STYLES[rank - 1] ?? RANK_STYLES[2]
  const RankIcon = rs.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{
        scale: 1.015,
        boxShadow: rank === 1
          ? `0 6px 24px ${GOLD_D}0.14), 0 0 0 1px ${GOLD_D}0.25)`
          : '0 4px 16px rgba(255,255,255,0.04)',
      }}
      transition={{ duration: 0.3, delay, ease: EASE }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px', borderRadius: 12,
        background: rank === 1 ? `${GOLD_D}0.06)` : 'rgba(255,255,255,0.02)',
        border: rank === 1 ? `1px solid ${GOLD_D}0.18)` : '1px solid rgba(255,255,255,0.05)',
        cursor: 'default',
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 9, background: rs.bg, border: `1px solid ${rs.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <RankIcon style={{ width: 14, height: 14, color: rs.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nome}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
          {total_compras} compra{total_compras !== 1 ? 's' : ''}
        </p>
      </div>
      <p style={{ color: GOLD, fontWeight: 900, fontSize: 15, margin: 0, flexShrink: 0 }}>
        {formatCurrency(animated)}
      </p>
    </motion.div>
  )
}

function TopClientesSection({ top_clientes, periodo_inicio_em }: {
  top_clientes: DashboardMetrics['top_clientes']
  periodo_inicio_em?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy style={{ width: 14, height: 14, color: '#080c14' }} />
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>Top Clientes do Período</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>
              {periodo_inicio_em
                ? `Desde ${formatDate(periodo_inicio_em)} · reseta com o dashboard`
                : 'Por faturamento gerado · reseta com o dashboard'}
            </p>
          </div>
        </div>
        {top_clientes.length > 0 && (
          <span style={{ padding: '3px 10px', borderRadius: 20, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.22)`, color: GOLD, fontSize: 11, fontWeight: 700 }}>
            Top {top_clientes.length}
          </span>
        )}
      </div>

      {/* Rows or empty state */}
      {top_clientes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '28px 20px', borderRadius: 14,
            border: `1px dashed ${GOLD_D}0.15)`,
            background: `${GOLD_D}0.03)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${GOLD_D}0.08)`, border: `1px solid ${GOLD_D}0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy style={{ width: 16, height: 16, color: `${GOLD_D}0.5)` }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 13, margin: 0 }}>
            Nenhum cliente registrado neste período
          </p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>
            Relate uma venda com um cliente cadastrado para aparecer aqui
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence>
            {top_clientes.map((c, i) => (
              <TopClienteRow
                key={c.id}
                rank={i + 1}
                nome={c.nome}
                total_gasto={c.total_gasto}
                total_compras={c.total_compras}
                delay={0.06 * i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ─── Lucro por Produto ────────────────────────────────────────────────────────

function LucroProdutoItem({ item, index }: { item: PeriodoProdutoStats; index: number }) {
  const animLucro = useCountUp(item.lucro)

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{
        scale: 1.015,
        boxShadow: '0 6px 22px rgba(34,197,94,0.09), 0 0 0 1px rgba(34,197,94,0.14)',
        borderColor: 'rgba(34,197,94,0.18)',
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: EASE }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.022)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'default',
      }}
    >
      {/* Image / placeholder */}
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        overflow: 'hidden', flexShrink: 0,
        background: `${GOLD_D}0.06)`,
        border: `1px solid ${GOLD_D}0.13)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {item.imagem_url ? (
          <Image
            src={item.imagem_url}
            alt={item.nome}
            fill
            sizes="42px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Package style={{ width: 16, height: 16, color: `${GOLD_D}0.35)` }} />
        )}
      </div>

      {/* Name + details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.nome}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
          {item.custo != null && (
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>
              Custo: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{formatCurrency(item.custo)}</span>
            </span>
          )}
          {item.preco_venda != null && (
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>
              Venda: <span style={{ color: GOLD }}>{formatCurrency(item.preco_venda)}</span>
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>
            {item.quantidade} un. vendida{item.quantidade !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Lucro total for this product */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ color: '#22c55e', fontWeight: 900, fontSize: 14, margin: 0, letterSpacing: '-0.01em' }}>
          {formatCurrency(animLucro)}
        </p>
        <p style={{ color: 'rgba(34,197,94,0.45)', fontSize: 10, margin: '2px 0 0' }}>lucro</p>
      </div>
    </motion.div>
  )
}

function LucroProdutoSection({ vendas_por_produto }: { vendas_por_produto: PeriodoProdutoStats[] }) {
  const lucroTotal = vendas_por_produto.reduce((acc, p) => acc + p.lucro, 0)
  const animTotal  = useCountUp(lucroTotal)

  if (vendas_por_produto.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ boxShadow: '0 8px 36px rgba(34,197,94,0.06)' }}
      transition={{ duration: 0.35, delay: 0.44, ease: EASE }}
      style={{ borderRadius: 16, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package style={{ width: 14, height: 14, color: '#22c55e' }} />
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>Lucro por Produto</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>
              Por lucro no período · reseta com o dashboard
            </p>
          </div>
        </div>

        {/* Lucro total chip */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', margin: 0 }}>Lucro Total</p>
          <motion.p
            key={lucroTotal}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ color: '#22c55e', fontWeight: 900, fontSize: 18, margin: '2px 0 0', letterSpacing: '-0.02em' }}
          >
            {formatCurrency(animTotal)}
          </motion.p>
        </div>
      </div>

      {/* Product rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence>
          {vendas_por_produto.map((item, i) => (
            <LucroProdutoItem key={item.nome} item={item} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Reset zone ───────────────────────────────────────────────────────────────

function ResetZone({
  onReset, isResetting, periodoStart,
}: {
  onReset: () => void
  isResetting: boolean
  periodoStart?: string
}) {
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (isResetting) return
    if (!confirming) { setConfirming(true); return }
    onReset()
    setConfirming(false)
  }

  const daysLabel = periodoStart
    ? (() => {
        const days = Math.max(1, Math.floor((Date.now() - new Date(periodoStart).getTime()) / 86_400_000) + 1)
        return `${days} dia${days !== 1 ? 's' : ''}`
      })()
    : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <AnimatePresence mode="wait">
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Tem certeza?</span>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setConfirming(false)}
              style={{ padding: '6px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(239,68,68,0.25)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClick}
              disabled={isResetting}
              style={{ padding: '6px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {isResetting ? 'Resetando…' : 'Confirmar'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.04, boxShadow: '0 4px 18px rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.96 }}
            onClick={handleClick}
            title={daysLabel ? `Período atual: ${daysLabel} — dados serão salvos no Histórico` : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <RotateCcw style={{ width: 13, height: 13 }} />
            Resetar Dashboard
            {daysLabel && (
              <span style={{ padding: '1px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                {daysLabel}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function GoldTooltip({ active, payload, label, currency = true }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  currency?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(8,12,20,0.97)', border: `1px solid ${GOLD_D}0.2)`, borderRadius: 10, padding: '10px 14px', minWidth: 140, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 6px' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: 12, fontWeight: 700, margin: '2px 0' }}>
          {p.name}: {currency ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, sub, children, delay = 0 }: {
  title: string; sub?: string; children: React.ReactNode; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ boxShadow: `0 8px 40px ${GOLD_D}0.07)` }}
      transition={{ duration: 0.35, delay, ease: EASE }}
      style={{ borderRadius: 16, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: '20px' }}
    >
      <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>{title}</p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '3px 0 0' }}>{sub}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DashboardClientProps {
  metrics: DashboardMetrics
}

export function DashboardClient({ metrics }: DashboardClientProps) {
  const router = useRouter()
  const [isResetting, startReset] = useTransition()

  const {
    faturamento_bruto, lucro_liquido, total_vendas, produtos_vendidos,
    ticket_medio, produto_mais_vendido, produto_mais_lucrativo,
    top_clientes, periodo_inicio_em,
    total_investido, clientes_cadastrados, clientes_recorrentes, estoque_baixo,
    meta_mensal, meta_atingida_percent, lucro_mes,
    vendas_por_dia, vendas_por_produto, evolucao_mensal,
  } = metrics

  const margem = faturamento_bruto > 0
    ? ((lucro_liquido / faturamento_bruto) * 100).toFixed(1)
    : '0.0'

  function handleReset() {
    startReset(async () => {
      const { error } = await resetDashboard()
      if (error) { toast.error(`Erro ao resetar: ${error}`); return }
      toast.success('Dashboard resetado! Novo período iniciado.')
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0 }}>Visão Geral</h2>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '4px 0 0' }}>
            {periodo_inicio_em
              ? `Período desde ${formatDate(periodo_inicio_em)} · dados do período atual`
              : 'Todos os dados · nenhum período definido'}
          </p>
        </div>
        <ResetZone onReset={handleReset} isResetting={isResetting} periodoStart={periodo_inicio_em} />
      </div>

      {/* ── Period stats ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, margin: 0 }}>Métricas do Período</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>Resetam com o dashboard</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <PeriodCard title="Faturamento Bruto" rawValue={faturamento_bruto} format={formatCurrency}
            sub="Total vendido no período" icon={DollarSign} delay={0} />
          <PeriodCard title="Lucro Líquido" rawValue={lucro_liquido} format={formatCurrency}
            sub={`${margem}% de margem`} icon={TrendingUp} delay={0.06} />
          <PeriodCard title="Vendas Totais" rawValue={total_vendas}
            format={(v) => Math.round(v).toString()}
            sub={`${produtos_vendidos} itens vendidos`} icon={ShoppingCart} delay={0.12} />
          <PeriodCard title="Ticket Médio" rawValue={ticket_medio} format={formatCurrency}
            sub="Por transação" icon={Zap} delay={0.18} />
        </div>
      </div>

      {/* ── Top Clientes (always visible, resets with dashboard) ── */}
      <TopClientesSection top_clientes={top_clientes} periodo_inicio_em={periodo_inicio_em} />

      {/* ── Always-on stats ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, margin: 0 }}>Dados Fixos</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>Nunca resetam — refletem o estado atual do negócio</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <AlwaysOnCard title="Clientes" rawValue={clientes_cadastrados}
            format={(v) => Math.round(v).toString()}
            sub={`${clientes_recorrentes} recorrentes`} icon={Users} delay={0.24} />
          <AlwaysOnCard title="Total Investido" rawValue={total_investido}
            format={formatCurrency} sub="Em estoque" icon={Package} delay={0.3} />
          <AlwaysOnCard title="Estoque Baixo" rawValue={estoque_baixo}
            format={(v) => Math.round(v).toString()}
            sub="Produtos com ≤ 5 un." icon={AlertTriangle} delay={0.36}
            alert={estoque_baixo > 0} />
        </div>
      </div>

      {/* ── Meta mensal ─────────────────────────────────────── */}
      {meta_mensal && meta_mensal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ boxShadow: `0 8px 32px ${GOLD_D}0.08)` }}
          transition={{ duration: 0.35, delay: 0.38, ease: EASE }}
          style={{ borderRadius: 16, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: '20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target style={{ width: 13, height: 13, color: GOLD }} />
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Meta Mensal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {meta_atingida_percent >= 100 && <CheckCircle2 style={{ width: 14, height: 14, color: '#22c55e' }} />}
              <span style={{ color: meta_atingida_percent >= 100 ? '#22c55e' : meta_atingida_percent >= 50 ? GOLD : 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 16 }}>
                {meta_atingida_percent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(meta_atingida_percent, 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
              style={{
                height: '100%', borderRadius: 99,
                background: meta_atingida_percent >= 100
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : meta_atingida_percent >= 50
                  ? `linear-gradient(90deg, ${GOLD}, #f5c842)`
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{formatCurrency(lucro_mes)} realizado este mês</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Meta: {formatCurrency(meta_mensal)}</span>
          </div>
        </motion.div>
      )}

      {/* ── Charts ──────────────────────────────────────────── */}
      <ChartCard title="Evolução Financeira" sub="Faturamento e lucro por mês (calendário)" delay={0.4}>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolucao_mensal}>
              <defs>
                <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={GOLD}     stopOpacity={0.22} />
                  <stop offset="95%" stopColor={GOLD}     stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gLuc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<GoldTooltip />} />
              <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke={GOLD}    fill="url(#gFat)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: GOLD, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="lucro"       name="Lucro"       stroke="#22c55e" fill="url(#gLuc)" strokeWidth={2}   dot={false} activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <LucroProdutoSection vendas_por_produto={vendas_por_produto} />

      <ChartCard title="Vendas Diárias" sub="Últimos 30 dias (calendário)" delay={0.52}>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendas_por_dia}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="data"
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.slice(8)}
              />
              <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<GoldTooltip currency={false} />} />
              <Bar dataKey="vendas" name="Vendas" fill={GOLD} radius={[3, 3, 0, 0]} fillOpacity={0.75} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* ── Destaques ────────────────────────────────────────── */}
      {(produto_mais_vendido || produto_mais_lucrativo || estoque_baixo > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.58, ease: EASE }}
          style={{ borderRadius: 16, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>Destaques</p>

          {produto_mais_vendido && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingCart style={{ width: 12, height: 12, color: GOLD }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Mais vendido</p>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '2px 0 0' }}>{produto_mais_vendido}</p>
              </div>
            </div>
          )}

          {produto_mais_lucrativo && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp style={{ width: 12, height: 12, color: '#22c55e' }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Mais lucrativo</p>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '2px 0 0' }}>{produto_mais_lucrativo}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Recorrência</p>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '2px 0 0' }}>
                {clientes_recorrentes} de {clientes_cadastrados} clientes
              </p>
            </div>
          </div>

          {estoque_baixo > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle style={{ width: 12, height: 12, color: '#ef4444' }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Atenção</p>
                <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, margin: '2px 0 0' }}>
                  {estoque_baixo} produto{estoque_baixo > 1 ? 's' : ''} com estoque baixo
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

    </div>
  )
}
