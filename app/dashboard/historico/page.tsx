'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, ChevronDown, ChevronUp,
  DollarSign, TrendingUp, ShoppingCart, Zap, Package,
  Calendar, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { getPeriodosHistorico } from '@/lib/actions/periodos'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DashboardPeriodo } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}

// ─── Mini stat ────────────────────────────────────────────────────────────────

function MiniStat({ label, value, icon: Icon, gold = false }: {
  label: string
  value: string
  icon: React.ElementType
  gold?: boolean
}) {
  return (
    <div style={{
      borderRadius: 12,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon style={{ width: 11, height: 11, color: gold ? GOLD : 'rgba(255,255,255,0.3)' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
      </div>
      <p style={{ color: gold ? GOLD : '#fff', fontWeight: 800, fontSize: 16, margin: 0 }}>{value}</p>
    </div>
  )
}

// ─── Period card ──────────────────────────────────────────────────────────────

function PeriodoCard({ periodo, index }: { periodo: DashboardPeriodo; index: number }) {
  const [expanded, setExpanded] = useState(false)

  const fim  = periodo.fim_em!
  const ini  = periodo.inicio_em
  const days = daysBetween(ini, fim)
  const margem = periodo.faturamento_bruto > 0
    ? ((periodo.lucro_liquido / periodo.faturamento_bruto) * 100).toFixed(1)
    : '0.0'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: EASE }}
      style={{
        borderRadius: 18,
        background: 'linear-gradient(145deg, rgba(13,24,41,0.97) 0%, rgba(8,12,20,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* gold top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, ${GOLD_D}0.4) 70%, transparent 100%)` }} />

      {/* Collapsed header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        {/* Date badge */}
        <div style={{ width: 46, height: 46, borderRadius: 12, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.2)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Calendar style={{ width: 14, height: 14, color: GOLD, marginBottom: 1 }} />
          <span style={{ color: GOLD, fontSize: 9, fontWeight: 700 }}>{new Date(fim).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</span>
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>
              {formatDate(ini)} → {formatDate(fim)}
            </span>
            <span style={{ padding: '2px 9px', borderRadius: 20, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.2)`, color: GOLD, fontSize: 10, fontWeight: 700 }}>
              {days} dia{days !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Fat: <span style={{ color: GOLD, fontWeight: 700 }}>{formatCurrency(periodo.faturamento_bruto)}</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Lucro: <span style={{ color: '#22c55e', fontWeight: 700 }}>{formatCurrency(periodo.lucro_liquido)}</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              {periodo.total_vendas} venda{periodo.total_vendas !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <div style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          {expanded
            ? <ChevronUp style={{ width: 16, height: 16 }} />
            : <ChevronDown style={{ width: 16, height: 16 }} />
          }
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <MiniStat label="Faturamento" value={formatCurrency(periodo.faturamento_bruto)} icon={DollarSign} gold />
                <MiniStat label="Lucro Líquido" value={formatCurrency(periodo.lucro_liquido)} icon={TrendingUp} />
                <MiniStat label="Vendas" value={periodo.total_vendas.toString()} icon={ShoppingCart} />
                <MiniStat label="Ticket Médio" value={formatCurrency(periodo.ticket_medio)} icon={Zap} />
                <MiniStat label="Itens Vendidos" value={periodo.produtos_vendidos.toString()} icon={Package} />
                <MiniStat label="Margem" value={`${margem}%`} icon={TrendingUp} />
              </div>

              {/* Timestamps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.2)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                    Início: {new Date(ini).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.2)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                    Encerramento: {new Date(fim).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 90, borderRadius: 18,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const [periodos, setPeriodos] = useState<DashboardPeriodo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPeriodosHistorico()
      .then(({ data, error }) => {
        if (error) toast.error('Erro ao carregar histórico')
        else setPeriodos(data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History style={{ width: 18, height: 18, color: '#080c14' }} />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0 }}>Histórico de Períodos</h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '3px 0 0' }}>
              Períodos encerrados via "Resetar Dashboard"
            </p>
          </div>
        </div>
        {periodos.length > 0 && (
          <div style={{ padding: '5px 14px', borderRadius: 20, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.25)`, color: GOLD, fontSize: 12, fontWeight: 700 }}>
            {periodos.length} período{periodos.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : periodos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            borderRadius: 20,
            border: '1px dashed rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${GOLD_D}0.08)`, border: `1px solid ${GOLD_D}0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History style={{ width: 22, height: 22, color: `${GOLD_D}0.5)` }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 14, margin: 0 }}>
            Nenhum período encerrado ainda
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0, maxWidth: 300 }}>
            Use o botão <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Resetar Dashboard</strong> na tela principal para criar snapshots dos seus períodos de venda.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {periodos.map((p, i) => (
              <PeriodoCard key={p.id} periodo={p} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
