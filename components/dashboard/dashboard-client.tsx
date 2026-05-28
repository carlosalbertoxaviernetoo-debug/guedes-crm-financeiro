'use client'

import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, Users, Target, AlertTriangle, Award, Zap
} from 'lucide-react'
import type { DashboardMetrics } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DashboardClientProps {
  metrics: DashboardMetrics
}

function StatCard({
  title, value, subtitle, icon: Icon, trend, color = 'default'
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; label: string }
  color?: 'default' | 'green' | 'amber' | 'red' | 'blue'
}) {
  const colorMap = {
    default: 'text-muted-foreground bg-muted/30',
    green: 'text-brand bg-brand/10',
    amber: 'text-amber-500 bg-amber-500/10',
    red: 'text-destructive bg-destructive/10',
    blue: 'text-blue-500 bg-blue-500/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {trend && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend.value >= 0 ? 'text-brand' : 'text-destructive')}>
          {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%</span>
          <span className="text-muted-foreground font-normal">{trend.label}</span>
        </div>
      )}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function DashboardClient({ metrics }: DashboardClientProps) {
  const {
    faturamento_bruto, lucro_liquido, total_vendas, produtos_vendidos,
    total_investido, ticket_medio, clientes_cadastrados, clientes_recorrentes,
    produto_mais_vendido, produto_mais_lucrativo, estoque_baixo,
    meta_mensal, meta_atingida_percent, lucro_mes, vendas_mes,
    vendas_por_dia, vendas_por_produto, evolucao_mensal
  } = metrics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Métricas financeiras e operacionais em tempo real</p>
      </div>

      {/* Primary stats — 4 cols */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(faturamento_bruto)}
          subtitle="Total acumulado"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(lucro_liquido)}
          subtitle={`${faturamento_bruto > 0 ? ((lucro_liquido / faturamento_bruto) * 100).toFixed(1) : 0}% de margem`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Vendas Totais"
          value={total_vendas.toString()}
          subtitle={`${produtos_vendidos} itens vendidos`}
          icon={ShoppingCart}
          color="default"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(ticket_medio)}
          subtitle="Por transação"
          icon={Zap}
          color="amber"
        />
      </div>

      {/* Secondary stats — 4 cols */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Lucro do Mês"
          value={formatCurrency(lucro_mes)}
          subtitle={`${vendas_mes} vendas no mês`}
          icon={Award}
          color="green"
        />
        <StatCard
          title="Clientes"
          value={clientes_cadastrados.toString()}
          subtitle={`${clientes_recorrentes} recorrentes`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Investido"
          value={formatCurrency(total_investido)}
          subtitle="Em estoque atual"
          icon={Package}
          color="default"
        />
        <StatCard
          title="Estoque Baixo"
          value={estoque_baixo.toString()}
          subtitle="Produtos com ≤5 unidades"
          icon={AlertTriangle}
          color={estoque_baixo > 0 ? 'red' : 'default'}
        />
      </div>

      {/* Meta mensal */}
      {meta_mensal && meta_mensal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-foreground">Meta do Mês</span>
            </div>
            <span className={cn(
              'text-sm font-bold',
              meta_atingida_percent >= 100 ? 'text-brand' :
              meta_atingida_percent >= 50 ? 'text-amber-500' : 'text-muted-foreground'
            )}>
              {meta_atingida_percent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(meta_atingida_percent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className={cn(
                'h-full rounded-full',
                meta_atingida_percent >= 100 ? 'bg-brand' :
                meta_atingida_percent >= 50 ? 'bg-amber-500' : 'bg-destructive'
              )}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(lucro_mes)} realizado</span>
            <span>Meta: {formatCurrency(meta_mensal)}</span>
          </div>
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Evolução financeira — área */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">Evolução Financeira</h3>
          <p className="text-xs text-muted-foreground mb-4">Faturamento e lucro por mês</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={evolucao_mensal}>
              <defs>
                <linearGradient id="gradFaturamento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#22c55e" fill="url(#gradFaturamento)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#3b82f6" fill="url(#gradLucro)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top produtos por lucro */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">Top Produtos</h3>
          <p className="text-xs text-muted-foreground mb-4">Por lucro total</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vendas_por_produto} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="lucro" name="Lucro" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendas diárias + highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vendas por dia */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">Vendas Diárias</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 30 dias</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vendas_por_dia}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="vendas" name="Nº Vendas" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Highlights */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Destaques</h3>

          {produto_mais_vendido && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingCart className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mais vendido</p>
                <p className="text-sm font-medium text-foreground">{produto_mais_vendido}</p>
              </div>
            </div>
          )}

          {produto_mais_lucrativo && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mais lucrativo</p>
                <p className="text-sm font-medium text-foreground">{produto_mais_lucrativo}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recorrência</p>
              <p className="text-sm font-medium text-foreground">
                {clientes_recorrentes} de {clientes_cadastrados} clientes
              </p>
            </div>
          </div>

          {estoque_baixo > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atenção</p>
                <p className="text-sm font-medium text-foreground">
                  {estoque_baixo} produto{estoque_baixo > 1 ? 's' : ''} com estoque baixo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
