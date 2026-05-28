'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Banknote,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressoMeta } from '@/components/metas/progresso-meta'
import { MetaForm } from '@/components/metas/meta-form'

import {
  getProgressoMeta,
  getMetaMensal,
  getMetaAnual,
} from '@/lib/actions/metas'
import { formatCurrency, formatPercent, getMesAtual, getAnoAtual, MESES_NOMES } from '@/lib/utils'
import type { Meta } from '@/types'

// ---------------------------------------------------------------------------
// Types for the monthly table
// ---------------------------------------------------------------------------

interface MesRow {
  mes: number
  nome: string
  meta: number | null
  realizado: number
  percentual: number
  atingida: boolean | null
}

// ---------------------------------------------------------------------------
// Custom tooltip for recharts
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground">
          <span className="font-medium" style={{ color: p.color }}>
            {p.name}:{' '}
          </span>
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat mini card
// ---------------------------------------------------------------------------

function MetaStat({
  icon: Icon,
  label,
  value,
  color = 'text-brand',
}: {
  icon: React.ElementType
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className={`h-4.5 w-4.5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Days prediction helper
// ---------------------------------------------------------------------------

function calcDiasPrediction(realizado: number, meta: number, mes: number, ano: number): string | null {
  if (!meta || meta <= 0 || realizado <= 0) return null
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(ano, mes, 0).getDate()
  if (dayOfMonth === 0) return null

  const dailyRate = realizado / dayOfMonth
  if (dailyRate <= 0) return null

  const daysNeeded = Math.ceil(meta / dailyRate)
  if (daysNeeded <= daysInMonth) {
    const daysLeft = daysNeeded - dayOfMonth
    if (daysLeft <= 0) return 'Meta atingida ou prestes a ser atingida!'
    return `No ritmo atual, a meta será atingida em ~${daysLeft} dia${daysLeft > 1 ? 's' : ''}.`
  }
  return `No ritmo atual, a meta não será atingida este mês.`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MetasPage() {
  const mes = getMesAtual()
  const ano = getAnoAtual()

  const [progresso, setProgresso] = useState<{
    meta: number | null
    realizado: number
    percentual: number
    restante: number
  } | null>(null)

  const [metaAnual, setMetaAnual] = useState<Meta | null>(null)
  const [realizadoAnual, setRealizadoAnual] = useState(0)
  const [mesesData, setMesesData] = useState<MesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  async function fetchAll() {
    setLoading(true)
    try {
      const [progressoResult, anualResult] = await Promise.all([
        getProgressoMeta(mes, ano),
        getMetaAnual(ano),
      ])

      if (progressoResult.data) setProgresso(progressoResult.data)
      if (anualResult.data) setMetaAnual(anualResult.data)

      // Build per-month data for the chart / table
      const rows: MesRow[] = []
      for (let m = 1; m <= 12; m++) {
        const [pResult, metaResult] = await Promise.all([
          getProgressoMeta(m, ano),
          getMetaMensal(m, ano),
        ])
        const p = pResult.data
        const mt = metaResult.data
        rows.push({
          mes: m,
          nome: MESES_NOMES[m - 1].slice(0, 3),
          meta: mt?.valor ?? null,
          realizado: p?.realizado ?? 0,
          percentual: p?.percentual ?? 0,
          atingida: mt?.valor
            ? (p?.realizado ?? 0) >= mt.valor
            : null,
        })
      }
      setMesesData(rows)

      const totalAnual = rows.reduce((s, r) => s + r.realizado, 0)
      setRealizadoAnual(totalAnual)
    } catch {
      toast.error('Erro ao carregar metas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const prediction = useMemo(() => {
    if (!progresso?.meta || !progresso.realizado) return null
    return calcDiasPrediction(progresso.realizado, progresso.meta, mes, ano)
  }, [progresso, mes, ano])

  const percentualAnual = useMemo(() => {
    if (!metaAnual?.valor || metaAnual.valor <= 0) return 0
    return Math.min(Math.round((realizadoAnual / metaAnual.valor) * 10000) / 100, 100)
  }, [metaAnual, realizadoAnual])

  // Chart data: only months that have data or meta
  const chartData = mesesData.filter((r) => r.meta !== null || r.realizado > 0)

  function handleMetaSaved() {
    setFormOpen(false)
    fetchAll()
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-48 rounded-xl bg-card border border-border" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card border border-border" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe e defina suas metas de faturamento.
          </p>
        </div>
        <Button variant="brand" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Definir meta
        </Button>
      </div>

      {/* Current month progress */}
      <Card>
        <CardContent className="pt-6 pb-6 px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold text-foreground">
                {MESES_NOMES[mes - 1]} {ano}
              </h2>
            </div>
            {!progresso?.meta && (
              <button
                onClick={() => setFormOpen(true)}
                className="text-xs text-brand hover:underline"
              >
                Definir meta mensal
              </button>
            )}
          </div>

          {progresso ? (
            <ProgressoMeta
              realizado={progresso.realizado}
              meta={progresso.meta}
              percentual={progresso.percentual}
              size="lg"
            />
          ) : (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              Nenhum dado disponível para este mês.
            </div>
          )}

          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">{prediction}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      {progresso && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaStat
            icon={Target}
            label="Meta mensal"
            value={progresso.meta ? formatCurrency(progresso.meta) : '—'}
            color="text-brand"
          />
          <MetaStat
            icon={Banknote}
            label="Realizado"
            value={formatCurrency(progresso.realizado)}
            color="text-blue-500"
          />
          <MetaStat
            icon={TrendingUp}
            label="Restante"
            value={progresso.restante > 0 ? formatCurrency(progresso.restante) : 'Meta atingida'}
            color={progresso.restante === 0 ? 'text-brand' : 'text-amber-500'}
          />
          <MetaStat
            icon={CheckCircle2}
            label="% Atingida"
            value={`${progresso.percentual.toFixed(1)}%`}
            color={
              progresso.percentual >= 80
                ? 'text-brand'
                : progresso.percentual >= 40
                ? 'text-amber-500'
                : 'text-red-500'
            }
          />
        </div>
      )}

      {/* Annual goal */}
      {(metaAnual || realizadoAnual > 0) && (
        <Card>
          <CardContent className="pt-6 pb-6 px-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <h2 className="text-base font-semibold text-foreground">
                  Meta Anual {ano}
                </h2>
              </div>
              {!metaAnual && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="text-xs text-brand hover:underline"
                >
                  Definir meta anual
                </button>
              )}
            </div>
            <ProgressoMeta
              realizado={realizadoAnual}
              meta={metaAnual?.valor ?? null}
              percentual={percentualAnual}
              label={`Meta anual ${ano}`}
              size="lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Bar chart: meta vs realizado */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              Meta vs Realizado — {ano}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={20} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="nome"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                    }
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 11,
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  />
                  <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.mes}
                        fill={
                          entry.atingida
                            ? 'hsl(var(--brand))'
                            : entry.mes === mes
                            ? 'hsl(38 92% 50%)'
                            : 'hsl(var(--muted-foreground))'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly progress table */}
      {mesesData.some((r) => r.meta !== null || r.realizado > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso Mensal — {ano}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase">
                    Mês
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase">
                    Meta
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase">
                    Realizado
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase">
                    %
                  </th>
                  <th className="py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mesesData.map((row) => {
                  const isCurrentMes = row.mes === mes
                  return (
                    <tr
                      key={row.mes}
                      className={`border-b border-border/50 transition-colors ${
                        isCurrentMes ? 'bg-muted/30' : 'hover:bg-muted/20'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          {MESES_NOMES[row.mes - 1]}
                          {isCurrentMes && (
                            <Badge variant="blue" size="sm">
                              Atual
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {row.meta ? formatCurrency(row.meta) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-foreground">
                        {row.realizado > 0 ? formatCurrency(row.realizado) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {row.meta ? (
                          <span
                            className={
                              row.percentual >= 80
                                ? 'text-brand font-semibold'
                                : row.percentual >= 40
                                ? 'text-amber-500 font-semibold'
                                : row.percentual > 0
                                ? 'text-red-500'
                                : 'text-muted-foreground'
                            }
                          >
                            {row.percentual.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.atingida === true ? (
                          <CheckCircle2 className="h-4 w-4 text-brand mx-auto" />
                        ) : row.atingida === false ? (
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Form modal */}
      <MetaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleMetaSaved}
        initialMes={mes}
        initialAno={ano}
      />
    </div>
  )
}
