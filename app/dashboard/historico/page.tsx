'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, ChevronDown, ChevronUp,
  DollarSign, TrendingUp, ShoppingCart, Zap, Package,
  Calendar, Clock, Trophy, Users, Wallet,
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
  label: string; value: string; icon: React.ElementType; gold?: boolean
}) {
  return (
    <div style={{
      borderRadius: 12, background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon style={{ width: 11, height: 11, color: gold ? GOLD : 'rgba(255,255,255,0.3)' }} />
        <span className="md:text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
      </div>
      <p className="md:text-lg" style={{ color: gold ? GOLD : '#fff', fontWeight: 800, fontSize: 16, margin: 0 }}>{value}</p>
    </div>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', margin: '4px 0 0' }}>
      {label}
    </p>
  )
}

// ─── Period card ──────────────────────────────────────────────────────────────

function PeriodoCard({ periodo, index }: { periodo: DashboardPeriodo; index: number }) {
  const [expanded, setExpanded] = useState(false)

  const fim    = periodo.fim_em!
  const ini    = periodo.inicio_em
  const days   = daysBetween(ini, fim)
  const dj     = periodo.dados_json
  const margem = periodo.faturamento_bruto > 0
    ? ((periodo.lucro_liquido / periodo.faturamento_bruto) * 100).toFixed(1)
    : (dj?.margem ?? '0.0')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ boxShadow: `0 8px 32px ${GOLD_D}0.07)`, borderColor: `${GOLD_D}0.16)` }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: EASE }}
      style={{
        borderRadius: 18,
        background: 'linear-gradient(145deg, rgba(13,24,41,0.97) 0%, rgba(8,12,20,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden', position: 'relative',
      }}
    >
      {/* gold top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, ${GOLD_D}0.4) 70%, transparent 100%)` }} />

      {/* Collapsed header */}
      <motion.button
        whileHover={{ background: 'rgba(255,255,255,0.015)' }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded((v) => !v)}
        transition={{ duration: 0.15 }}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        {/* Date badge */}
        <motion.div
          animate={expanded ? { background: `${GOLD_D}0.18)`, borderColor: `${GOLD_D}0.35)` } : {}}
          style={{ width: 46, height: 46, borderRadius: 12, background: `${GOLD_D}0.1)`, border: `1px solid ${GOLD_D}0.2)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Calendar style={{ width: 14, height: 14, color: GOLD, marginBottom: 1 }} />
          <span style={{ color: GOLD, fontSize: 9, fontWeight: 700 }}>{new Date(fim).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</span>
        </motion.div>

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
        <motion.div
          animate={{ rotate: expanded ? 180 : 0, color: expanded ? GOLD : 'rgba(255,255,255,0.3)' }}
          transition={{ duration: 0.22 }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown style={{ width: 16, height: 16 }} />
        </motion.div>
      </motion.button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* ── Stats grid ── */}
              <div>
                <SectionTitle label="Métricas do período" />
                <div className="md:grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                  <MiniStat label="Faturamento"   value={formatCurrency(periodo.faturamento_bruto)} icon={DollarSign} gold />
                  <MiniStat label="Lucro Líquido" value={formatCurrency(periodo.lucro_liquido)} icon={TrendingUp} />
                  <MiniStat label="Vendas"        value={periodo.total_vendas.toString()} icon={ShoppingCart} />
                  <MiniStat label="Ticket Médio"  value={formatCurrency(periodo.ticket_medio)} icon={Zap} />
                  <MiniStat label="Itens Vendidos" value={periodo.produtos_vendidos.toString()} icon={Package} />
                  <MiniStat label="Margem"        value={`${margem}%`} icon={TrendingUp} />
                </div>
              </div>

              {/* ── Dados fixos no momento do reset ── */}
              {dj && (
                <div>
                  <SectionTitle label="Dados no momento do encerramento" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                    <MiniStat label="Clientes"     value={dj.clientes_cadastrados.toString()} icon={Users} />
                    <MiniStat label="Recorrentes"  value={dj.clientes_recorrentes.toString()} icon={Users} />
                    <MiniStat label="Total Invest." value={formatCurrency(dj.total_investido)} icon={Wallet} />
                  </div>
                </div>
              )}

              {/* ── Top Clientes ── */}
              {dj?.top_clientes && dj.top_clientes.length > 0 && (
                <div>
                  <SectionTitle label="Top clientes do período" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {dj.top_clientes.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, ease: EASE }}
                        whileHover={{ scale: 1.012, borderColor: `${GOLD_D}0.2)` }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: i === 0 ? `${GOLD_D}0.05)` : 'rgba(255,255,255,0.02)', border: i === 0 ? `1px solid ${GOLD_D}0.15)` : '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? `${GOLD_D}0.15)` : 'rgba(255,255,255,0.06)', border: `1px solid ${i === 0 ? GOLD_D + '0.25)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy style={{ width: 10, height: 10, color: i === 0 ? GOLD : 'rgba(255,255,255,0.35)' }} />
                          </div>
                          <div>
                            <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0 }}>{c.nome}</p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{c.total_compras} compra{c.total_compras !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <p style={{ color: GOLD, fontWeight: 900, fontSize: 13, margin: 0 }}>{formatCurrency(c.total_gasto)}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Produtos vendidos ── */}
              {dj?.vendas_por_produto && dj.vendas_por_produto.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <SectionTitle label="Lucro por produto" />
                    <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 12 }}>
                      Total: {formatCurrency(dj.vendas_por_produto.reduce((a, p) => a + p.lucro, 0))}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {dj.vendas_por_produto.map((p, i) => (
                      <motion.div
                        key={p.nome}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, ease: EASE }}
                        whileHover={{ scale: 1.012, borderColor: 'rgba(34,197,94,0.18)' }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#fff', fontSize: 11, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                              {p.quantidade} un.
                            </span>
                            {p.custo != null && (
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                                Custo: <span style={{ color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(p.custo)}</span>
                              </span>
                            )}
                            {p.preco_venda != null && (
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                                Venda: <span style={{ color: GOLD }}>{formatCurrency(p.preco_venda)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ color: '#22c55e', fontWeight: 800, fontSize: 13, margin: 0 }}>{formatCurrency(p.lucro)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Destaques ── */}
              {(dj?.produto_mais_vendido || dj?.produto_mais_lucrativo) && (
                <div>
                  <SectionTitle label="Destaques" />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {dj.produto_mais_vendido && (
                      <div style={{ flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 10, background: `${GOLD_D}0.05)`, border: `1px solid ${GOLD_D}0.13)` }}>
                        <p style={{ color: GOLD, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Mais vendido</p>
                        <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dj.produto_mais_vendido}</p>
                      </div>
                    )}
                    {dj.produto_mais_lucrativo && (
                      <div style={{ flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.13)' }}>
                        <p style={{ color: '#22c55e', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Mais lucrativo</p>
                        <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dj.produto_mais_lucrativo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Timestamps ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.18)' }} />
                  <span className="md:text-sm" style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>
                    Início: {new Date(ini).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.18)' }} />
                  <span className="md:text-sm" style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>
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
        <div key={i} style={{ height: 90, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const [periodos, setPeriodos] = useState<DashboardPeriodo[]>([])
  const [loading, setLoading]   = useState(true)

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
              Períodos encerrados com snapshot completo
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
          style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${GOLD_D}0.08)`, border: `1px solid ${GOLD_D}0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History style={{ width: 22, height: 22, color: `${GOLD_D}0.5)` }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 14, margin: 0 }}>Nenhum período encerrado ainda</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0, maxWidth: 300 }}>
            Use o botão <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Resetar Dashboard</strong> na tela principal para criar snapshots completos.
          </p>
        </motion.div>
      ) : (
        <div className="md:max-w-4xl" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
