'use client'

import { useEffect, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  Save,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Banknote,
  Package,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { getHistoricoMensal, salvarMesAtual } from '@/lib/actions/historico'
import {
  formatCurrency,
  formatMonthYear,
  getMesAtual,
  getAnoAtual,
  MESES_NOMES,
} from '@/lib/utils'
import type { HistoricoMensal } from '@/types'

// ---------------------------------------------------------------------------
// Custom tooltip
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
// Growth badge
// ---------------------------------------------------------------------------

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const isUp = pct >= 0
  const Icon = isUp ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isUp ? 'text-brand' : 'text-red-500'
      }`}
    >
      <Icon className="h-3 w-3" />
      {isUp ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Row detail
// ---------------------------------------------------------------------------

function HistoricoRow({
  row,
  prev,
}: {
  row: HistoricoMensal
  prev: HistoricoMensal | undefined
}) {
  const [expanded, setExpanded] = useState(false)

  const mesNome = `${MESES_NOMES[row.mes - 1]} ${row.ano}`

  const fatGrowth =
    prev && prev.faturamento_bruto > 0
      ? ((row.faturamento_bruto - prev.faturamento_bruto) / prev.faturamento_bruto) * 100
      : null

  const lucroGrowth =
    prev && prev.lucro_liquido > 0
      ? ((row.lucro_liquido - prev.lucro_liquido) / prev.lucro_liquido) * 100
      : null

  const margemPct =
    row.faturamento_bruto > 0
      ? (row.lucro_liquido / row.faturamento_bruto) * 100
      : 0

  const isCurrentMonth =
    row.mes === getMesAtual() && row.ano === getAnoAtual()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Collapsed row */}
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{mesNome}</span>
            {isCurrentMonth && (
              <Badge variant="blue" size="sm">Mês atual</Badge>
            )}
            {row.meta_atingida === true && (
              <Badge variant="success" size="sm" dot>
                Meta atingida
              </Badge>
            )}
            {row.meta_atingida === false && (
              <Badge variant="destructive" size="sm">
                Meta não atingida
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Faturamento:{' '}
              <span className="font-medium text-foreground">
                {formatCurrency(row.faturamento_bruto)}
              </span>
            </span>
            {fatGrowth !== null && <GrowthBadge pct={fatGrowth} />}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Lucro</p>
            <p className="text-sm font-semibold text-brand">
              {formatCurrency(row.lucro_liquido)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Vendas</p>
            <p className="text-sm font-semibold text-foreground">{row.total_vendas}</p>
          </div>
          {row.meta_mensal && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Meta</p>
              <p className="text-sm font-medium text-muted-foreground">
                {formatCurrency(row.meta_mensal)}
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Banknote className="h-3 w-3" />
                  Faturamento
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(row.faturamento_bruto)}
                </p>
                {fatGrowth !== null && <GrowthBadge pct={fatGrowth} />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Lucro líquido
                </p>
                <p className="text-sm font-semibold text-brand">
                  {formatCurrency(row.lucro_liquido)}
                </p>
                {lucroGrowth !== null && <GrowthBadge pct={lucroGrowth} />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <ShoppingBag className="h-3 w-3" />
                  Total vendas
                </p>
                <p className="text-sm font-semibold text-foreground">{row.total_vendas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Package className="h-3 w-3" />
                  Produtos vendidos
                </p>
                <p className="text-sm font-semibold text-foreground">{row.produtos_vendidos}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Margem</p>
                <p className="text-sm font-semibold text-foreground">
                  {margemPct.toFixed(1)}%
                </p>
              </div>
            </div>

            {row.meta_mensal && (
              <div className="border-t border-border px-5 py-3 flex items-center gap-4">
                {row.meta_atingida === true ? (
                  <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <p className="text-xs text-muted-foreground">
                  Meta:{' '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(row.meta_mensal)}
                  </span>{' '}
                  —{' '}
                  {row.meta_atingida
                    ? 'Meta atingida!'
                    : `Faltou ${formatCurrency(
                        Math.max(row.meta_mensal - row.faturamento_bruto, 0)
                      )}`}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HistoricoPage() {
  const [historico, setHistorico] = useState<HistoricoMensal[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, startSave] = useTransition()

  async function loadData() {
    setLoading(true)
    const { data, error } = await getHistoricoMensal()
    if (error) toast.error(error)
    else setHistorico(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleSalvar() {
    startSave(async () => {
      const { error } = await salvarMesAtual()
      if (error) {
        toast.error(error)
      } else {
        toast.success('Mês atual salvo no histórico!')
        await loadData()
      }
    })
  }

  // Chart data (ascending order for the line chart)
  const chartData = [...historico].map((row) => ({
    name: `${MESES_NOMES[row.mes - 1].slice(0, 3)}/${row.ano.toString().slice(2)}`,
    faturamento: row.faturamento_bruto,
    lucro: row.lucro_liquido,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Evolução mensal do faturamento e lucro.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleSalvar}
          loading={isSaving}
        >
          <Save className="h-4 w-4" />
          Salvar mês atual
        </Button>
      </div>

      {/* Line chart */}
      {chartData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              Evolução — Faturamento e Lucro
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
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
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento"
                    stroke="hsl(var(--brand))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--brand))' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lucro"
                    name="Lucro"
                    stroke="hsl(217 91% 60%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(217 91% 60%)' }}
                    activeDot={{ r: 5 }}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : historico.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Nenhum histórico salvo ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em <span className="font-medium">Salvar mês atual</span> para registrar os dados do mês corrente.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleSalvar}
            loading={isSaving}
          >
            <Save className="h-3.5 w-3.5" />
            Salvar mês atual
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Render descending (latest first) */}
          {[...historico].reverse().map((row, i, arr) => {
            const prevInReversed = arr[i + 1]
            return (
              <HistoricoRow
                key={row.id}
                row={row}
                prev={prevInReversed}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
