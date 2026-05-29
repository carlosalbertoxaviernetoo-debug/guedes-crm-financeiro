import { Suspense } from 'react'
import { getVendas } from '@/lib/actions/vendas'
import { StatsGrid } from '@/components/ui/stats-grid'
import { VendasPageClient } from '@/components/vendas/vendas-page-client'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface VendasPageProps {
  searchParams: Promise<{ mes?: string; ano?: string }>
}

export default async function VendasPage({ searchParams }: VendasPageProps) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ? parseInt(params.mes) : now.getMonth() + 1
  const ano = params.ano ? parseInt(params.ano) : now.getFullYear()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico completo de vendas e desempenho financeiro
        </p>
      </div>

      <Suspense fallback={<VendasSkeleton />}>
        <VendasContent mes={mes} ano={ano} />
      </Suspense>
    </div>
  )
}

async function VendasContent({ mes, ano }: { mes: number; ano: number }) {
  const { data: vendas, error } = await getVendas(mes, ano)

  if (error || !vendas) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-border bg-card">
        <p className="text-muted-foreground text-sm">
          Erro ao carregar vendas. Tente recarregar a página.
        </p>
      </div>
    )
  }

  // Compute stats
  const totalVendas = vendas.length
  const faturamento = vendas.reduce((s, v) => s + v.valor_total, 0)
  const lucro = vendas.reduce((s, v) => s + v.lucro, 0)
  const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0
  const margemMedia = faturamento > 0 ? (lucro / faturamento) * 100 : 0

  const stats = [
    {
      title: 'Vendas no mês',
      value: String(totalVendas),
      iconName: 'shopping-cart' as const,
      iconVariant: 'brand' as const,
      changeLabel: `${mes < 10 ? '0' + mes : mes}/${ano}`,
    },
    {
      title: 'Faturamento',
      value: formatCurrency(faturamento),
      iconName: 'dollar-sign' as const,
      iconVariant: 'info' as const,
      changeLabel: `${totalVendas} transação${totalVendas !== 1 ? 'ões' : ''}`,
    },
    {
      title: 'Lucro líquido',
      value: formatCurrency(lucro),
      iconName: 'trending-up' as const,
      iconVariant: lucro >= 0 ? ('brand' as const) : ('destructive' as const),
      changeLabel: `Margem média: ${margemMedia.toFixed(1)}%`,
    },
    {
      title: 'Ticket médio',
      value: formatCurrency(ticketMedio),
      iconName: 'receipt-text' as const,
      iconVariant: 'purple' as const,
      changeLabel: 'por venda',
    },
  ]

  return (
    <>
      {/* Stats row */}
      <StatsGrid items={stats} />

      {/* Client section (period selector + table + export) */}
      <VendasPageClient initialVendas={vendas} currentMes={mes} currentAno={ano} />
    </>
  )
}

function VendasSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-card border border-border" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-40 rounded-md bg-card border border-border" />
        <div className="h-9 w-40 rounded-md bg-card border border-border" />
        <div className="ml-auto h-9 w-32 rounded-md bg-card border border-border" />
      </div>
      <div className="h-96 rounded-xl bg-card border border-border" />
    </div>
  )
}
